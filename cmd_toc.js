/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, allCmd = require('./all_cmd.js'),
  cmdVerbatim = require('./cmd_verbatim.js');

EX.defaultTocPfx = '### ';
EX.defaultTocFmt = '  * [&$caption;](#&$npmdash;)';
EX.tocStopMarkRgx = /^[ \t]*<!--#toc[ \t]+stop="scan"[ \t]+-->/;

EX.cmd = {};

EX.cmd.toc = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
  var renderer = this, stop = tag.popAttr('stop');
  switch (stop) {
  case undefined:
    break;
  case 'scan':
    return '';
  default:
    throw tag.err('unsupported stop mode: ' + stop);
  }
  tag.try(allCmd.replaceUntilMark, [buf]);
  return EX.tocGen(tag, buf, renderer);
};


EX.tocGen = function (tag, buf, renderer) {
  var text = [], scanNextLine, ln,
    pfx = tag.popAttr('pfx', EX.defaultTocPfx),
    fmt = tag.popAttr('fmt', EX.defaultTocFmt);
  buf = buf.clone();
  scanNextLine = function () {
    if (cmdVerbatim.checkEat(renderer, buf)) { return; }
    ln = buf.eatLine().replace(/\s+$/, '');
    if (!ln) { return; }
    if (EX.tocStopMarkRgx.exec(ln)) {
      buf = null;
      return;
    }
    if (!ln.startsWith(pfx)) { return; }
    ln = ln.slice(pfx.length);
    if (!ln) { return; }
    try {
      ln = EX.tocFmt(fmt, ln);
    } catch (tocFmtErr) {
      throw tag.err(String(tocFmtErr.message || tocFmtErr));
    }
    text.push(ln);
  };
  while (buf && buf.notEmpty()) { scanNextLine(); }
  return text.concat('',
    ''    // <-- Github work-around
    ).join('\n');
};


EX.tocFmt = function (fmt, ln) {
  return fmt.replace(/\&\$([A-Za-z0-9\-]+);/g, function (match, slot) {
    switch (slot) {
    case 'caption':
      return ln;
    case 'npmdash':
      return ln.toLowerCase().replace(/ /g, '-'
        ).match(/([a-z0-9\-]+)/g).join('');
    }
    throw new Error('unsupporte toc fmt slot name: ' + (match && slot));
  });
};








/*scroll*/
