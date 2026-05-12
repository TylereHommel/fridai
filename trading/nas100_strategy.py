"""
NAS100_USD 5-min 200 SMA pullback strategy — OANDA practice account

Entry (long only):
  - 5-min candle wicks to or below 200 SMA
  - Candle closes above 200 SMA
  - SMA stack bullish: 200 SMA < 50 SMA < 10 SMA

Stop loss : low of the entry candle
Take profit: entry + 1.5R
Position  : 1% account NAV risked per trade
            OANDA NAS100_USD: pip = 0.1 pts, pip value = $0.10/unit → $1.00/point/unit
            units = risk_amount / risk_in_points

Trading window: 6:30 AM – 9:00 AM PT (market open to mid-morning)
If no entry by 9:00 AM PT, idles until 6:30 AM PT next trading day.

Setup:
  pip install -r requirements.txt
  set OANDA_API_KEY=your_practice_token
  set OANDA_ACCOUNT_ID=your_account_id   (e.g. 101-001-12345678-001)
  python nas100_strategy.py
"""

import os
import time
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests
import pandas as pd

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY    = os.environ["OANDA_API_KEY"]
ACCOUNT_ID = os.environ["OANDA_ACCOUNT_ID"]
INSTRUMENT = "NAS100_USD"
BASE_URL   = "https://api-fxpractice.oanda.com"   # swap to api-fxtrade.oanda.com for live

RISK_PCT   = 0.01    # 1% NAV per trade
RR         = 1.5     # take profit at 1.5R
POLL_SECS  = 30      # seconds between bar scans

PT           = ZoneInfo("America/Los_Angeles")
WINDOW_START = (6, 30)   # 6:30 AM PT
WINDOW_END   = (9,  0)   # 9:00 AM PT

# ── HTTP session ──────────────────────────────────────────────────────────────
http = requests.Session()
http.headers.update({
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type":  "application/json",
})

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger(__name__)


# ── OANDA API ─────────────────────────────────────────────────────────────────

def get_nav():
    r = http.get(f"{BASE_URL}/v3/accounts/{ACCOUNT_ID}/summary")
    r.raise_for_status()
    return float(r.json()["account"]["NAV"])


def fetch_bars(count=250):
    r = http.get(
        f"{BASE_URL}/v3/instruments/{INSTRUMENT}/candles",
        params={"granularity": "M5", "count": count, "price": "M"},
    )
    r.raise_for_status()
    rows = [
        {
            "time":  c["time"],
            "open":  float(c["mid"]["o"]),
            "high":  float(c["mid"]["h"]),
            "low":   float(c["mid"]["l"]),
            "close": float(c["mid"]["c"]),
        }
        for c in r.json()["candles"] if c["complete"]
    ]
    df = pd.DataFrame(rows).set_index("time")
    df["sma10"]  = df["close"].rolling(10).mean()
    df["sma50"]  = df["close"].rolling(50).mean()
    df["sma200"] = df["close"].rolling(200).mean()
    return df.dropna()


def has_open_position():
    r = http.get(f"{BASE_URL}/v3/accounts/{ACCOUNT_ID}/positions/{INSTRUMENT}")
    if r.status_code == 404:
        return False
    r.raise_for_status()
    return int(r.json()["position"]["long"]["units"]) > 0


def has_pending_order():
    r = http.get(
        f"{BASE_URL}/v3/accounts/{ACCOUNT_ID}/orders",
        params={"instrument": INSTRUMENT, "state": "PENDING"},
    )
    r.raise_for_status()
    return len(r.json()["orders"]) > 0


def has_position_or_order():
    return has_open_position() or has_pending_order()


def place_order(entry, stop, tp, units):
    payload = {
        "order": {
            "type":       "MARKET",
            "instrument": INSTRUMENT,
            "units":      str(units),
            "stopLossOnFill":   {"price": f"{stop:.1f}"},
            "takeProfitOnFill": {"price": f"{tp:.1f}"},
        }
    }
    r = http.post(f"{BASE_URL}/v3/accounts/{ACCOUNT_ID}/orders", json=payload)
    r.raise_for_status()
    data = r.json()
    order_id = data.get("orderFillTransaction", {}).get("id", "pending")
    log.info(
        f"ORDER PLACED  id={order_id}  units={units}  "
        f"entry≈{entry:.1f}  stop={stop:.1f}  tp={tp:.1f}"
    )
    return data


# ── Time helpers ──────────────────────────────────────────────────────────────

def now_pt():
    return datetime.now(PT)


def in_trading_window():
    hm = (now_pt().hour, now_pt().minute)
    return WINDOW_START <= hm < WINDOW_END


def past_trading_window():
    hm = (now_pt().hour, now_pt().minute)
    return hm >= WINDOW_END


def is_weekday():
    return now_pt().weekday() < 5


def secs_until_next_window():
    t = now_pt()
    nxt = t.replace(hour=WINDOW_START[0], minute=WINDOW_START[1], second=0, microsecond=0)
    if t >= nxt:
        nxt += timedelta(days=1)
    while nxt.weekday() >= 5:   # skip Saturday/Sunday
        nxt += timedelta(days=1)
    return (nxt - t).total_seconds()


# ── Signal ────────────────────────────────────────────────────────────────────

def check_signal(df):
    """Returns (signal, entry, stop, tp, units). signal=False means no trade."""
    if len(df) < 1:
        return False, 0, 0, 0, 0

    c = df.iloc[-1]   # all rows filtered to complete=True

    bullish_stack = c.sma200 < c.sma50 < c.sma10
    touched_sma   = c.low  <= c.sma200
    closed_above  = c.close > c.sma200

    log.info(
        f"close={c.close:.1f}  low={c.low:.1f} | "
        f"sma10={c.sma10:.1f}  sma50={c.sma50:.1f}  sma200={c.sma200:.1f} | "
        f"stack={'Y' if bullish_stack else 'N'}  "
        f"touch={'Y' if touched_sma else 'N'}  "
        f"above={'Y' if closed_above else 'N'}"
    )

    if not (bullish_stack and touched_sma and closed_above):
        return False, 0, 0, 0, 0

    entry = c.close
    stop  = c.low
    risk  = entry - stop

    if risk <= 0:
        log.warning("Risk <= 0, skipping")
        return False, 0, 0, 0, 0

    tp    = round(entry + RR * risk, 1)
    nav   = get_nav()
    units = int((nav * RISK_PCT) / risk)

    if units < 1:
        log.warning(f"Units too small ({units}, ${risk:.1f} risk/unit), skipping")
        return False, 0, 0, 0, 0

    return True, entry, stop, tp, units


# ── Main loop ─────────────────────────────────────────────────────────────────

def run():
    log.info(f"Strategy live — {INSTRUMENT} 5-min 200 SMA pullback (PRACTICE)")
    traded_today = False
    last_date    = None

    while True:
        try:
            today = now_pt().date()

            # Reset on new calendar day
            if last_date != today:
                if last_date is not None:
                    log.info(f"New day ({today}), resetting")
                traded_today = False
                last_date    = today

            # Detect existing position/order on restart mid-day
            if not traded_today and has_position_or_order():
                log.info("Existing position/order detected — marking traded_today")
                traded_today = True

            # Already in a trade — bracket manages exit server-side
            if traded_today:
                time.sleep(60)
                continue

            # Past window or weekend — sleep until next session open
            if past_trading_window() or not is_weekday():
                secs = secs_until_next_window()
                log.info(f"Window closed — sleeping {secs / 3600:.1f}h until next session")
                time.sleep(secs)
                continue

            # Before window opens
            if not in_trading_window():
                time.sleep(60)
                continue

            # Scan for signal
            df = fetch_bars()
            signal, entry, stop, tp, units = check_signal(df)

            if signal:
                place_order(entry, stop, tp, units)
                traded_today = True

        except Exception as e:
            log.error(f"Unhandled error: {e}")

        time.sleep(POLL_SECS)


if __name__ == "__main__":
    run()
