// Copyright (C) 2018 Josh Ventura
// This code is distributed under the GNU General Public License, Version 3.
// You may use, modify, and distribute it per the terms of that license.

const find = require('find');

const commands = {};

function loadPlugins() {
  console.log('Loading plugins...');
  const plugin_srcs = find.fileSync(/.*[.]js$/, __dirname + '/commands/');
  const plugins = [];
  for (const src of plugin_srcs) {
    plugins.push(require(src));
  }

  console.log('Installing commands...');
  for (const plugin of plugins) {
    if (plugin.hasOwnProperty('commands')) {
      for (const command in plugin.commands) {
        if (plugin.commands.hasOwnProperty(command)) {
          commands[command] = plugin.commands[command];
        }
      }
    }
  }
}

function commandExists(cmd) {
  return commands.hasOwnProperty(cmd);
}

function executeCommand(command, args) {
  const cmd = commands[command];
  if (cmd.hasOwnProperty('arg_parser')) {
    if (cmd.arg_parser == null) {
      if (args.length) {
        return 'It should appear `!' + command + '` takes no parameters.'
      }
      return cmd.handler();
    }
    return cmd.handler(cmd.arg_parser(command, args));
  }
}

function knownCommands() {
  const cmds = [];
  for (const command in commands) cmds.push(command);
  return "Supported commands: " + cmds.join(', ');
}

function getCommandHelp(command) {
  command = command.trim();
  if (command.length) {
    if (!commands.hasOwnProperty(command)) {
      return `Unknown command "${command}". ` + knownCommands();
    }
    return '`' + command + "`: " + commands[command].help;
  }
  return knownCommands();
}


exports.loadPlugins = loadPlugins
exports.executeCommand = executeCommand
exports.knownCommands = knownCommands
exports.getCommandHelp = getCommandHelp
exports.commandExists = commandExists
