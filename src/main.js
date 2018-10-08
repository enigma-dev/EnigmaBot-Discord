// Copyright (C) 2018 Josh Ventura
// This code is distributed under the GNU General Public License, Version 3.
// You may use, modify, and distribute it per the terms of that license.

module.paths.push(__dirname)
const Discord = require('discord.js');
const handlers = require("handlers.js");
const auth = require('auth.json');

handlers.initalize();

console.log('Configuring client...');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  handlers.loggedIn();
});

client.on('message', handlers.messageReceived);
client.on('error', console.error);

console.log('Connecting...');
client.login(auth.token);

