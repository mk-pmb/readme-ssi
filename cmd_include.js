/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, allCmd = require('./all_cmd.js'),
  codeQuot = allCmd.markDown.codeBlockQuotes,
  cmdVerbatim = require('./cmd_verbatim.js');

EX.cmd = {};

EX.cmd.include = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
  var renderer = this, endMark, opts;
  opts = tag.popAttr(['code', 'file', 'start', 'stop', 'maxln',
    'indent', 'outdent']);

  if (cmdVerbatim.checkEat(renderer, buf)) { endMark = true; }
  if (!endMark) {
    endMark = (opts.code === undefined ? allCmd.defaultReplaceEndMark
      : codeQuot);
    tag.try(allCmd.replaceUntilMark, [buf]);
    if (opts.code !== undefined) {
      opts.code = (opts.code || 'text');
      if (buf.peekLine() === codeQuot + '\n') { buf.eat(); }
    }
  }

  if (opts.file) {
    return function ssiEchoJsonFetcher(deliver) {
      renderer.readFileRel(opts.file,
        EX.includeGeneric.bind(renderer, opts, tag, deliver));
    };
  }
  throw tag.err('No source file specified');
};


EX.includeGeneric = function (opts, tag, deliver, readErr, text) {
  if (readErr) { return deliver(readErr); }
  var maxLnCnt = +opts.maxln;
  text = String(text).split(/[ \t\r]*\n/);
  if (opts.start !== undefined) {
    text.start = text.indexOf(opts.start);
    if (text.start < 0) {
      return deliver(tag.err('Cannot find start mark: ' + opts.start));
    }
    text = text.slice(text.start + 1);
  }
  if (opts.stop !== undefined) {
    text.stop = text.indexOf(opts.stop);
    if (text.stop < 0) {
      return deliver(tag.err('Cannot find stop mark: ' + opts.stop));
    }
    text = text.slice(0, text.stop);
  }
  if (maxLnCnt && (maxLnCnt < text.length)) { text = text.slice(0, maxLnCnt); }
  if (opts.outdent || opts.indent) {
    text = text.map(EX.redentOneLine.bind(null,
      opts.outdent, (opts.indent || '')));
  }
  if (opts.code !== undefined) {
    text.unshift(codeQuot + (opts.code || 'text'));
    text.push(codeQuot);
  }
  text.unshift('<!--#verbatim lncnt="' + text.length + '" -->');
  return deliver(null, text.concat('').join('\n'));
};


EX.redentOneLine = function (outdent, indent, ln) {
  if (outdent && ln.startsWith(outdent)) { ln = ln.slice(outdent.length); }
  return (indent + ln);
};









/*scroll*/
