// Copyright (C) 2018 Josh Ventura
// This code is distributed under the GNU General Public License, Version 3.
// You may use, modify, and distribute it per the terms of that license.

module.paths.push(__dirname)
const handlers = require("handlers.js");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

handlers.initalize();
handlers.loggedIn();

console.log('> ');

readline.on('line', (line) => {
  if (line == 'quit') process.exit(0);
  console.log(`Got "${line}"`)
  const msg = {
    'content': line,
    'channel': {
      'send': console.log
    }
  }
  handlers.messageReceived(msg);
});
