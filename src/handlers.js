// Copyright (C) 2018 Josh Ventura
// This code is distributed under the GNU General Public License, Version 3.
// You may use, modify, and distribute it per the terms of that license.

const plugins = require("pluginmgr.js");

const UNKNOWN_COMMAND_MESSAGES = [
  'Are you talking to me?',
  'Did someone ring?',
  'Where am I? Who am I?',
  'I feel a disturbance in the force...',
  'ERROR: Does not compute.',
  'Ugh. Is fundies talking?',
  'Are you sure?',
]

function choose(opts) {
  if (!opts.length) return '';
  return opts[(Math.random() * opts.length | 0) % opts.length];
}

function isString(obj) {
  return typeof(obj) === 'string' || obj instanceof String;
}

function initalize() {
  plugins.loadPlugins();
}

function messageReceived(msg) {
  if (msg.content.startsWith('!')) {
    let i = 1;
    while (i < msg.content.length && /\w/.test(msg.content[i])) ++i;
    const command = msg.content.substring(1, i).toLowerCase();
    while (i < msg.content.length && /\s/.test(msg.content[i])) ++i;
    const arguments = msg.content.substr(i);
    
    if (command == 'help') {
      msg.channel.send(plugins.getCommandHelp(arguments));
      return;
    }
    if (!plugins.commandExists(command)) {
      msg.channel.send(choose(UNKNOWN_COMMAND_MESSAGES));
      return;
    }
    const messages = plugins.executeCommand(command, arguments);
    if (isString(messages)) {
      msg.channel.send(messages);
    } else if (Array.isArray(messages)) {
      if (messages.length > 3) {
        msg.channel.send('The command attempted to send '
                         + messages.length + ' messages...');
        return;
      }
      for (const message of messages) {
        if (isString(message)) {
          msg.channel.send(message);
        }
      }
    }
  }
}

function loggedIn() {}

exports.initalize = initalize;
exports.messageReceived = messageReceived;
exports.loggedIn = loggedIn;
