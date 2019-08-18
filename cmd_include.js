/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, coreCmds = require('./core_cmds.js'),
  codeQuot = coreCmds.markDown.codeBlockQuotes,
  cmdVerbatim = require('./cmd_verbatim.js'),
  Promise = require('bluebird'),
  kisi = require('./kitchen_sink.js');

function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function opporSplit(x, s) { return (x && ifFun(x.split) ? x.split(s) : x); }
function trimRight(s) { return s.replace(/\s+$/, ''); }

EX.cmd = {};
EX.transforms = {
  mjsUsageDemo1802: require('./transforms/mjsUsageDemo1802'),
  trimR: function (lines) { return lines.map(trimRight); },
};

EX.cmd.include = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
  var renderer = this, endMark, opts;
  opts = tag.popAttr(['code', 'file', 'start', 'stop', 'maxln',
    'indent', 'outdent', 'cut-head', 'cut-tail', 'transform']);

  if (cmdVerbatim.checkEat(renderer, buf)) { endMark = true; }
  if (!endMark) {
    endMark = (opts.code === undefined ? undefined : codeQuot);
    tag.try(coreCmds.replaceUntilMark, [buf, endMark]);
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
  if (text.err) { return deliver(text.err); }

  Promise.try(function applyTransforms() {
    return EX.applyTransforms(opts.transform, text, {
      opts: opts,
      tag: tag,
    });
  }).then(function transformed(lines) {
    var verbatim = lines.length, before = [verbatim], after = [];
    if (opts.code !== undefined) {
      before.push(codeQuot + (opts.code || 'text'));
      after.push(codeQuot);
      verbatim += 2;
    }
    before[0] = '<!--#verbatim lncnt="' + verbatim + '" -->';
    deliver(null, before.concat(lines, after, '').join('\n'));
  }).then(null, deliver);
};


EX.applyTransforms = function (trNames, origLines, meta) {
  if (!trNames) { return origLines; }
  function applyOne(lines, trName) {
    if (!trName) { return lines; }
    return Promise.try(function () {
      var how = EX.transforms[trName];
      if (!ifFun(how)) { throw new Error('unsupported transform: ' + trName); }
      return how(lines, meta);
    }).then(function (trLn) {
      trLn = opporSplit(trLn, /\n/);
      if (!trLn) {
        throw new Error('bad data after transform: ' + trName + ': ' + trLn);
      }
      return trLn;
    });
  }
  return Promise.reduce(opporSplit(trNames, /\s+/), applyOne, origLines);
};


EX.redentOneLine = function (outdent, cutHead, cutTail, indent, ln) {
  if (outdent && ln.startsWith(outdent)) { ln = ln.slice(outdent.length); }
  ln = kisi.multiMarkSplit(ln, cutHead, -1);
  ln = kisi.multiMarkSplit(ln, cutTail, 0);
  return (indent + ln);
};









/*scroll*/
