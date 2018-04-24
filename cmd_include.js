/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, allCmd = require('./all_cmd.js'),
  codeQuot = allCmd.markDown.codeBlockQuotes,
  cmdVerbatim = require('./cmd_verbatim.js'),
  kisi = require('./kitchen_sink.js');

function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }

EX.cmd = {};
EX.transforms = {
  mjsUsageDemo1802: require('./transforms/mjsUsageDemo1802'),
};

EX.cmd.include = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
  var renderer = this, endMark, opts;
  opts = tag.popAttr(['code', 'file', 'start', 'stop', 'maxln',
    'indent', 'outdent', 'cut-head', 'cut-tail']);

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
    return function ssiIncludeFileFetcher(deliver) {
      renderer.readFileRel(opts.file,
        EX.includeGeneric.bind(renderer, opts, tag, deliver));
    };
  }
  throw tag.err('No source file specified');
};


EX.includeGeneric = function (opts, tag, deliver, readErr, text) {
  if (readErr) { return deliver(readErr); }
  var maxLnCnt = +opts.maxln;
  text = String(text);
  if (text[0] === '\uFEFF') { text = text.slice(1); }
  text = text.replace(/\s+$/, '').split(/[ \t\r]*\n/);
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
  if (opts.outdent || opts.indent || opts['cut-head'] || opts['cut-tail']) {
    text = text.map(EX.redentOneLine.bind(null,
      opts.outdent,
      opts['cut-head'],
      opts['cut-tail'],
      (opts.indent || '')));
  }
  if (opts.code !== undefined) {
    text.unshift(codeQuot + (opts.code || 'text'));
    text.push(codeQuot);
  }
  text = EX.applyTransforms(tag, text);
  if (text.err) { return deliver(text.err); }
  text.unshift('<!--#verbatim lncnt="' + text.length + '" -->');
  return deliver(null, text.concat('').join('\n'));
};


EX.applyTransforms = function (tag, text) {
  var trNames = tag.popAttr('transform', '').split(/\s+/);
  if (!trNames) { return text; }
  try {
    trNames.forEach(function (trName) {
      var tf = EX.transforms[trName];
      if (!tf) { return; }
      if (!ifFun(tf)) { throw new Error('unsupported transform: ' + trName); }
      text = tf(text, tag);
      if ((!text) && (text !== '')) {
        throw new Error('bad data after transform: ' + trName + ': ' + text);
      }
      if (text.split) { text = text.split(/\n/); }
    });
  } catch (transErr) {
    text = { err: transErr };
  }
  return text;
};


EX.redentOneLine = function (outdent, cutHead, cutTail, indent, ln) {
  if (outdent && ln.startsWith(outdent)) { ln = ln.slice(outdent.length); }
  ln = kisi.multiMarkSplit(ln, cutHead, -1);
  ln = kisi.multiMarkSplit(ln, cutTail, 0);
  return (indent + ln);
};









/*scroll*/
