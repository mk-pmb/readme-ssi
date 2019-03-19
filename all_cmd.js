/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var core = require('./core_cmds.js'), extra, all = Object.assign({}, core);
extra = [
  require('./cmd_echo.js'),
  require('./cmd_include.js'),
  require('./cmd_toc.js'),
  require('./cmd_verbatim.js'),
];
extra.forEach(function add(mod) { Object.assign(all, mod.cmd); });

module.exports = all;
