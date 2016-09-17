/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, allCmd = require('./all_cmd.js'),
  cmdVerbatim = require('./cmd_verbatim.js');

EX.defaultTocPfx = '### ';
EX.defaultTocFmt = '  * [&$caption;](#&$anchor;)';
EX.tocStopMarkRgx = /^[ \t]*<!--#toc[ \t]+stop="scan"[ \t]+-->/;
EX.markDownLinksRgx = /\[(\S*?)\]\(\S*?\)/g;
EX.defaultAnchor = 'toc-#';

EX.cmd = {};

EX.cmd.toc = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
  var renderer = this, stop = tag.popAttr('stop'), headlines = [];
  switch (stop) {
  case undefined:
    break;
  case 'scan':
    return '';
  default:
    throw tag.err('unsupported stop mode: ' + stop);
  }
  tag.try(allCmd.replaceUntilMark, [buf]);
  tag.tocText = EX.tocGen(tag, buf, renderer, headlines);
  EX.tocAddAnchorTargets(tag, buf, headlines);
  return tag.tocText;
};


EX.tocGen = function (tag, buf, renderer, headlines) {
  var scanNextLine, ln, alreadyEatenOffset = -1, opts = {
    pfx: tag.popAttr('pfx', EX.defaultTocPfx),
    fmt: tag.popAttr('fmt', EX.defaultTocFmt),
    captionStart: tag.popAttr('cap-start'),
    captionEnd: tag.popAttr('cap-end'),
    anchor: tag.popAttr('anchor', EX.defaultAnchor),
  };
  if (!headlines) { headlines = []; }
  buf = buf.clone();
  headlines.srcOffset = buf.calcPosLnChar();
  scanNextLine = function () {
    if (cmdVerbatim.checkEat(renderer, buf)) { return; }
    ln = buf.eatLine().replace(/\s+$/, '');
    if (!ln) { return; }
    if (EX.tocStopMarkRgx.exec(ln)) {
      buf = null;
      return;
    }
    ln = EX.tocFindCaption(ln, opts);
    if (!ln) { return; }
    ln = {
      caption: ln,
      anchor: opts.anchor.replace(/#/g, EX.dashify(ln)),
      srcPos: buf.calcPosLnChar(),
    };
    ln.srcPos.ln += alreadyEatenOffset;
    ln.tocLine = tag.try(EX.tocFmt, [opts.fmt, {
      caption: ln.caption.replace(/\[|\]/g, EX.xmlCharRef),
      anchor: ln.anchor,
    }], ln);
    headlines.push(ln);
  };
  while (buf && buf.notEmpty()) { scanNextLine(); }
  return headlines.map(function (hl) { return hl.tocLine; }).concat('',
    ''    // <-- Github work-around
    ).join('\n');
};


EX.multiMarkSplit = function (text, mark, idx) {
  if (!mark) { return text; }
  text = text.split(new RegExp(String(mark).replace(/(\W)/g, '\\$1'
    ).replace(/\\\x00/g, '|'), ''));
  if (idx === undefined) { return text; }
  if (idx < 0) { idx += text.length; }
  return text[idx];
};


EX.tocFindCaption = function (ln, opts) {
  if (!ln.startsWith(opts.pfx)) { return; }
  ln = ln.slice(opts.pfx.length);
  if (!ln) { return; }
  ln = ln.replace(EX.markDownLinksRgx, '$1');
  ln = EX.multiMarkSplit(ln, opts.captionStart, -1);
  ln = EX.multiMarkSplit(ln, opts.captionEnd, 0);
  return ln;
};


EX.dashify = function (text) {
  return text.toLowerCase().match(/([a-z0-9]+)/g).join('-');
};


EX.xmlCharRef = function (c) {
  c = c.charCodeAt(0).toString(16).toUpperCase();
  return '&#x' + (c.length % 2 ? '0' : '') + c + ';';
};


EX.tocFmt = function (fmt, slots) {
  return fmt.replace(/\&\$([A-Za-z0-9\-]+);/g, function (match, slot) {
    match = slots[slot];
    if (match !== undefined) { return match; }
    throw new Error('unsupporte toc fmt slot name: ' + slot);
  });
};


EX.tocAddAnchorTargets = function (tag, buf, headlines) {
  var bufLines = buf.buf.split(/\n/);
  tag = '<a class="readme-ssi-toc-target"';
  headlines.forEach(function (hl) {
    var lnumRel = hl.srcPos.ln - headlines.srcOffset.ln,
      anchorLineNum = lnumRel - 1,
      anchorLineOld = bufLines[anchorLineNum],
      anchorLineNew = tag + ' id="' + hl.anchor +
        '" name="' + hl.anchor + '"></a>';
    if (anchorLineOld && anchorLineOld.startsWith(tag)) {
      bufLines[anchorLineNum] = anchorLineNew;
    } else {
      bufLines[lnumRel] = anchorLineNew + '\n' + bufLines[lnumRel];
    }
  });
  buf.buf = bufLines.join('\n');
};











/*scroll*/
