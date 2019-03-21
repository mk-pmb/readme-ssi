/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var rms = require('.'), cliArgs = process.argv.slice(2),
  srcFn = (cliArgs.shift() || 'README.md'),
  saveAs = (cliArgs.shift() || srcFn),
  rendered = false;

process.on('exit', function verifyReadmeWasRendered(retval) {
  if (retval !== 0) { return; }
  if (!rendered) { throw new Error('failed to render readme'); }
});

function whenRendered(err) {
  rendered = true;
  if (err) { throw err; }
}

rms.fromFileToFile(srcFn, saveAs, whenRendered);
