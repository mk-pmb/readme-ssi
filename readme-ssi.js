/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';


var EX = module.exports, SsiLikeFile = require('render-ssi-like-file-pmb');

EX.cmd = [ require('./all_cmd.js'),
  require('./cmd_echo.js'),
  require('./cmd_include.js'),
  require('./cmd_toc.js'),
  require('./cmd_verbatim.js'),
  ].reduce(function (cmds, mod) { return Object.assign(cmds, mod.cmd); }, {});


EX.fromFile = function (srcFn, deliver) {
  var readme = new SsiLikeFile();
  if (deliver === process) {
    (function parseArgs(args) {
      srcFn = (args.shift() || srcFn);
      readme.saveAsFilename = (args.shift() || srcFn);
    }(process.argv.slice(2)));
    readme.rendered = false;
    process.on('exit', function verifyReadmeWasRendered(retval) {
      if (retval !== 0) { return; }
      if (!readme.rendered) { throw new Error('failed to render readme'); }
    });
    deliver = EX.saveIfRendered.bind(null, readme, function (err) {
      readme.rendered = true;
      if (err) { throw err; }
    });
  }
  readme.normalizeWhitespace = true;
  readme.filename = srcFn;
  readme.commands = EX.cmd;
  if (+process.env.DEBUGLEVEL > 2) {
    readme.log = console.error.bind(console);
  }
  return readme.render(deliver);
};


EX.saveIfRendered = function (readme, whenSaved, renderErr) {
  if (renderErr) { return whenSaved(renderErr, readme); }
  return readme.saveToFile(readme.saveAsFilename, whenSaved);
};
















if (require.main === module) { EX.fromFile('README.md', process); }
