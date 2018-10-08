# EnigmaBot for Discord

A Discord port of the almost-sorta-basically-semi-quasi-popular ENIGMA IRC bot.
Now written in JavaScript.

It's a little early to start talking up the code in this project, but the hope
is that it will one day grow up to be what OMGBot was trying to be.

To configure, add your bot's auth token to `auth.json`
(follow the format of `auth.json.in`).

To run locally (offline), invoke this command:
```bash
NODE_PATH=`pwd`/src node src/devconsole.js
```

To run online, invoke this command:
```bash
NODE_PATH=`pwd`/src node src/main.js
```

Or just `./launch`, because I'm lazy, too.
