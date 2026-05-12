"""
QQQ 5-min 200 SMA pullback strategy — Alpaca paper trading

Entry (long only):
  - 5-min candle wicks to or below 200 SMA
  - Candle closes above 200 SMA
  - SMA stack bullish: 200 SMA < 50 SMA < 10 SMA

Stop loss : low of the entry candle
Take profit: entry + 1.5R
Position  : 1% account equity risked per trade

Trading window: 6:30 AM – 9:00 AM PT (market open to mid-morning)
If no entry by 9:00 AM PT, algo idles until 6:30 AM PT next day.

Setup:
  pip install -r requirements.txt
  set ALPACA_API_KEY=your_paper_key
  set ALPACA_API_SECRET=your_paper_secret
  python qqq_strategy.py
"""

import os
import time
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, StopLossRequest, TakeProfitRequest
from alpaca.trading.enums import OrderSide, TimeInForce, OrderClass
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame, TimeFrameUnit
import pandas as pd

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY    = os.environ["ALPACA_API_KEY"]
API_SECRET = os.environ["ALPACA_API_SECRET"]
SYMBOL     = "QQQ"
RISK_PCT   = 0.01        # 1% equity per trade
RR         = 1.5         # take profit at 1.5R
POLL_SECS  = 30          # seconds between bar scans

PT            = ZoneInfo("America/Los_Angeles")
WINDOW_START  = (6, 30)  # 6:30 AM PT — market open
WINDOW_END    = (9,  0)  # 9:00 AM PT — cutoff

# ── Clients ───────────────────────────────────────────────────────────────────
trading = TradingClient(API_KEY, API_SECRET, paper=True)
data    = StockHistoricalDataClient(API_KEY, API_SECRET)

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger(__name__)


# ── Time helpers ──────────────────────────────────────────────────────────────

def now_pt():
    return datetime.now(PT)


def in_trading_window():
    t = now_pt()
    hm = (t.hour, t.minute)
    return WINDOW_START <= hm < WINDOW_END


def past_trading_window():
    t = now_pt()
    return (t.hour, t.minute) >= WINDOW_END


def secs_until_next_window():
    """Seconds until 6:30 AM PT tomorrow (or today if not yet reached)."""
    t = now_pt()
    next_open = t.replace(hour=WINDOW_START[0], minute=WINDOW_START[1], second=0, microsecond=0)
    if t >= next_open:
        next_open += timedelta(days=1)
    return (next_open - t).total_seconds()


# ── Market helpers ────────────────────────────────────────────────────────────

def market_open():
    return trading.get_clock().is_open


def has_position_or_order():
    try:
        trading.get_open_position(SYMBOL)
        return True
    except Exception:
        pass
    return any(o.symbol == SYMBOL for o in trading.get_orders())


# ── Data ──────────────────────────────────────────────────────────────────────

def fetch_bars(limit=250):
    req = StockBarsRequest(
        symbol_or_symbols=SYMBOL,
        timeframe=TimeFrame(5, TimeFrameUnit.Minute),
        limit=limit,
    )
    bars = data.get_stock_bars(req)
    df = bars.df
    if isinstance(df.index, pd.MultiIndex):
        df = df.xs(SYMBOL, level=0)
    df = df.sort_index()
    df["sma10"]  = df["close"].rolling(10).mean()
    df["sma50"]  = df["close"].rolling(50).mean()
    df["sma200"] = df["close"].rolling(200).mean()
    return df.dropna()


# ── Signal ────────────────────────────────────────────────────────────────────

def check_signal(df):
    """Returns (signal, entry, stop, tp, qty). signal=False means no trade."""
    if len(df) < 2:
        return False, 0, 0, 0, 0

    c = df.iloc[-2]  # last *completed* candle; iloc[-1] may still be forming

    bullish_stack = c.sma200 < c.sma50 < c.sma10
    touched_sma   = c.low  <= c.sma200
    closed_above  = c.close > c.sma200

    log.info(
        f"close={c.close:.2f}  low={c.low:.2f} | "
        f"sma10={c.sma10:.2f}  sma50={c.sma50:.2f}  sma200={c.sma200:.2f} | "
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

    tp     = round(entry + RR * risk, 2)
    equity = float(trading.get_account().equity)
    qty    = int((equity * RISK_PCT) / risk)

    if qty < 1:
        log.warning(f"Position too small (qty={qty}, risk/share=${risk:.2f}), skipping")
        return False, 0, 0, 0, 0

    return True, entry, stop, tp, qty


# ── Execution ─────────────────────────────────────────────────────────────────

def place_order(entry, stop, tp, qty):
    order = trading.submit_order(
        MarketOrderRequest(
            symbol=SYMBOL,
            qty=qty,
            side=OrderSide.BUY,
            time_in_force=TimeInForce.DAY,
            order_class=OrderClass.BRACKET,
            stop_loss=StopLossRequest(stop_price=round(stop, 2)),
            take_profit=TakeProfitRequest(limit_price=tp),
        )
    )
    log.info(
        f"ORDER PLACED  id={order.id}  qty={qty}  "
        f"entry≈{entry:.2f}  stop={stop:.2f}  tp={tp:.2f}"
    )
    return order


# ── Main loop ─────────────────────────────────────────────────────────────────

def run():
    log.info(f"Strategy live — {SYMBOL} 5-min 200 SMA pullback (PAPER)")
    traded_today = False
    last_date    = None

    while True:
        try:
            today = now_pt().date()

            # Reset flag at start of each new calendar day
            if last_date != today:
                if last_date is not None:
                    log.info(f"New day ({today}), resetting")
                traded_today = False
                last_date    = today

            # If script restarted mid-day with an active position, treat as traded
            if not traded_today and has_position_or_order():
                log.info("Existing position/order detected — marking traded_today")
                traded_today = True

            # Already in a trade — bracket order manages exit, nothing to do
            if traded_today:
                time.sleep(60)
                continue

            # Past window with no trade — sleep until 6:30 AM PT next session
            if past_trading_window():
                secs = secs_until_next_window()
                log.info(f"9:00 AM PT passed, no entry taken — sleeping {secs/3600:.1f}h until next window")
                time.sleep(secs)
                continue

            # Before window opens
            if not in_trading_window():
                time.sleep(60)
                continue

            # Inside window — need market to be open
            if not market_open():
                log.info("In window but market not open yet, sleeping 30s")
                time.sleep(30)
                continue

            # Scan for signal
            df = fetch_bars()
            signal, entry, stop, tp, qty = check_signal(df)

            if signal:
                place_order(entry, stop, tp, qty)
                traded_today = True

        except Exception as e:
            log.error(f"Unhandled error: {e}")

        time.sleep(POLL_SECS)


if __name__ == "__main__":
    run()
