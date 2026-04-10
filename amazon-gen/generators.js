const crypto = require('crypto');
const config = require('./config');

const FIRST_NAMES = [
  'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
  'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
  'Christopher','Daniel','Paul','Mark','Donald','George','Kenneth','Steven','Edward','Brian',
  'Dorothy','Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily',
  'Jason','Ryan','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott',
  'Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia','Kathleen','Amy',
  'Brandon','Benjamin','Samuel','Raymond','Gregory','Frank','Alexander','Patrick','Jack','Dennis'
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'
];

const ADDRESS_SUFFIXES = ['Dr', 'Drive', 'Dr.'];
const APT_VARIANTS = [null, null, null, 'Apt 1', 'Apt 2', 'Apt 3', 'Unit A', 'Unit B', 'Suite 1'];

const WORDS = [
  'maple','river','stone','cloud','frost','swift','bright','cedar','oak','pine',
  'lake','moon','star','wind','eagle','hawk','bear','wolf','fox','deer',
  'blue','red','gold','silver','iron','steel','storm','thunder','lightning','shadow'
];

let domainIndex = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  return {
    firstName: randomFrom(FIRST_NAMES),
    lastName: randomFrom(LAST_NAMES),
  };
}

function randomEmail() {
  const word = randomFrom(WORDS);
  const digits = randomInt(100, 9999);
  const domain = config.domains[domainIndex % config.domains.length];
  domainIndex++;
  return `${word}${digits}@${domain}`;
}

function randomPassword() {
  const word = randomFrom(WORDS);
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
  const digits = randomInt(100, 999);
  const symbols = ['!', '@', '#', '$', '&'];
  return `${capitalized}${digits}${randomFrom(symbols)}`;
}

function jiggedAddress() {
  const suffix = randomFrom(ADDRESS_SUFFIXES);
  const apt = randomFrom(APT_VARIANTS);
  const b = config.billing;
  // Replace suffix in original address
  const base = b.address.replace(/Dr\.?$/, suffix);
  const full = apt ? `${base} ${apt}` : base;
  return `${full}, ${b.city}, ${b.state} ${b.zip}`;
}

function randomGmailAddress() {
  const word1 = randomFrom(WORDS);
  const word2 = randomFrom(WORDS);
  const digits = randomInt(100, 9999);
  return `${word1}${word2}${digits}@gmail.com`;
}

module.exports = { randomName, randomEmail, randomPassword, jiggedAddress, randomGmailAddress, randomFrom, randomInt };
