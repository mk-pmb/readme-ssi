/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var core = require('./core_cmds.js'), allCmds = {}, cmdMods;
cmdMods = [
  core,
  require('./cmd_echo.js'),
  require('./cmd_include.js'),
  require('./cmd_sync_icons.js'),
  require('./cmd_toc.js'),
  require('./cmd_verbatim.js'),
];
cmdMods.forEach(function add(mod) { Object.assign(allCmds, mod.cmd); });

module.exports = allCmds;
