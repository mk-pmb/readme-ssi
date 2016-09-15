/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function isStr(x) { return ((typeof x) === 'string'); }
function quot(x) { return (isStr(x) ? '"' + x + '"' : String(x)); }
function eq(x, y) { return (x === y); }

var EX = module.exports, SsiLikeFile = require('render-ssi-like-file-pmb'),
  ersatzWordWrap = require('./ersatz_wordwrap.js');

EX.wordWrap = ersatzWordWrap;
EX.defaultReplaceEndMark = /^[ \t]*<\!\-{2}/;
EX.defaultTocPfx = '### ';
EX.defaultTocFmt = '  * [&$caption;](#&$npmdash;)';
EX.tocStopMarkRgx = /^[ \t]*<!--#toc[ \t]+stop="scan"[ \t]+-->/;

EX.markDown = {
  codeBlockQuotes: '```',
};


EX.prepareCmd = function (text, tag, buf) {
  var lineRemainder = buf.peekLine();
  if (lineRemainder) {
    tag.origText += lineRemainder;
    buf.eat();
  }
  return text;
};


EX.finishCmd = function (text, tag) {
  SsiLikeFile.rejectLeftoverAttrs(tag);
  switch (text && typeof text) {
  case 'function':
    tag.filterFetchedText = EX.preserveOrigText.bind(null, tag);
    break;
  case '':
  case 'string':
    text = EX.preserveOrigText(tag, text);
    break;
  }
  return text;
};


EX.preserveOrigText = function (tag, text) {
  text = (tag.origText || '<!-- !! no origText?? !! -->\n') + text;
  return text;
};


EX.cmd = {
  '>prefix': '!--#',
  '>suffix': ' --',
  '>before': EX.prepareCmd,
  '>after': EX.finishCmd,
};


EX.eatLinesBeforeMark = function (tag, buf, mark) {
  var eaten = '', ln;
  if (isStr(mark)) { mark = { exec: eq.bind(null, mark + '\n') }; }
  while (true) {
    ln = buf.peekLine();
    if (!ln) { return tag.err('Cannot find end mark ' + quot(mark)); }
    if (mark.exec(ln)) { return eaten; }
    eaten += buf.eat();
  }
};


EX.cmd.echo = function (text, tag, buf) {
  if (text) { tag.err('unexpected input text'); }
  EX.eatLinesBeforeMark(tag, buf, EX.defaultReplaceEndMark);
  var renderer = this, srcFn, opts = {
    before: tag.popAttr('before', ''),
    after:  tag.popAttr('after', ''),
    wrap:   (+tag.popAttr('wrap') || 78),
    underline:  tag.popAttr('underline', ''),
  };
  srcFn = tag.popAttr('json');
  if (srcFn) {
    opts.diveDataObj = tag.popAttr('key');
    return function ssiEchoJsonFetcher(deliver) {
      renderer.readFileRel(srcFn, 'json',
        EX.echoGeneric.bind(renderer, opts, deliver));
    };
  }
  return tag.err('No source file specified');
};


EX.echoGeneric = function (opts, deliver, readErr, data) {
  if (readErr) { return deliver(readErr); }
  var divePath = opts.diveDataObj;
  if (divePath) {
    divePath = (divePath.match(/^[A-Za-z0-9_]/) ? divePath.split(/\./)
      : divePath.slice(1).split(divePath[0]));
    divePath.forEach(function (key) { data = (data || false)[key]; });
  }
  switch (data && typeof data) {
  case 'string':
    break;
  default:
    data = JSON.stringify(data, null, 2);
  }
  data = (opts.before || '') + data + (opts.after || '');
  if (opts.wrap) { data = EX.wordWrap(data, opts.wrap); }
  if (data && opts.underline) {
    data += '\n' + data.replace(/\S|\s/g, opts.underline
      ).substr(0, data.length);
  }
  if (data) { data += '\n'; }
  return deliver(null, data);
};


EX.cmd.toc = function (text, tag, buf) {
  if (text) { tag.err('unexpected input text'); }
  var renderer = this, stop = tag.popAttr('stop');
  switch (stop) {
  case undefined:
    break;
  case 'scan':
    return '';
  default:
    return tag.err('unsupported stop mode: ' + quot(stop));
  }
  EX.eatLinesBeforeMark(tag, buf, EX.defaultReplaceEndMark);
  return EX.tocGen(tag, buf, renderer);
};


EX.tocGen = function (tag, buf, renderer) {
  var text = [], scanNextLine, ln,
    pfx = tag.popAttr('pfx', EX.defaultTocPfx),
    fmt = tag.popAttr('fmt', EX.defaultTocFmt);
  buf = buf.clone();
  scanNextLine = function () {
    if (EX.checkEatVerbatimCmd(renderer, buf)) { return; }
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
      return tag.err(String(tocFmtErr.message || tocFmtErr));
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


EX.cmd.verbatim = function (text, tag, buf) {
  if (text) { tag.err('unexpected input text'); }
  var until = parseInt(tag.popAttr('lncnt'), 10);
  // use parseInt: it will give NaN. not 0, if there are no digits.
  if (until === 0) { return ''; }
  if (until > 0) {
    for (text = ''; until > 0; until -= 1) { text += buf.eatLine(); }
    return text;
  }
  until = tag.popReqAttr('until');
  if (until[0] === '&') {
    until = ({
      '&,': EX.markDown.codeBlockQuotes,
    }[tag.rawAttrs.until] || until);
  }
  text = EX.eatLinesBeforeMark(tag, buf, until);
  text += buf.eatLine();
  return text;
};


EX.checkEatVerbatimCmd = function (renderer, buf) {
  var text = buf.peekLine(), cmd;
  if (!text.match(/^[ \t]*<!--#verbatim[\s\n]/)) { return false; }
  cmd = renderer.tokenizeMaybeTag(buf);
  if (!cmd) { return false; }
  if (cmd.cmdName !== 'verbatim') { return false; }
  text = buf.peekLine().replace(/\s+$/, '');
  if (text) { return cmd.err('unexpected text after command: ' + text); }
  text = buf.eat();
  text += EX.cmd.verbatim('', cmd, buf);
  return text;
};


EX.cmd.include = function (text, tag, buf) {
  if (text) { tag.err('unexpected input text'); }
  var renderer = this, endMark, opts;
  opts = tag.popAttr(['code', 'file', 'start', 'stop', 'maxln',
    'indent', 'outdent']);

  if (EX.checkEatVerbatimCmd(renderer, buf)) { endMark = true; }
  if (!endMark) {
    endMark = (opts.code === undefined ? EX.defaultReplaceEndMark
      : EX.markDown.codeBlockQuotes);
    EX.eatLinesBeforeMark(tag, buf, endMark);
    if (opts.code !== undefined) {
      opts.code = (opts.code || 'text');
      if (buf.peekLine() === EX.markDown.codeBlockQuotes + '\n') { buf.eat(); }
    }
  }

  if (opts.file) {
    return function ssiEchoJsonFetcher(deliver) {
      renderer.readFileRel(opts.file,
        EX.includeGeneric.bind(renderer, opts, tag, deliver));
    };
  }
  return tag.err('No source file specified');
};


EX.includeGeneric = function (opts, tag, deliver, readErr, text) {
  if (readErr) { return deliver(readErr); }
  var maxLnCnt = +opts.maxln;
  text = String(text).split(/[ \t\r]*\n/);
  if (opts.start !== undefined) {
    text.start = text.indexOf(opts.start);
    if (text.start < 0) {
      return tag.err('Cannot find start mark: '
        + quot(opts.start), deliver);
    }
    text = text.slice(text.start + 1);
  }
  if (opts.stop !== undefined) {
    text.stop = text.indexOf(opts.stop);
    if (text.stop < 0) {
      return tag.err('Cannot find stop mark: '
        + quot(opts.stop), deliver);
    }
    text = text.slice(0, text.stop);
  }
  if (maxLnCnt && (maxLnCnt < text.length)) { text = text.slice(0, maxLnCnt); }
  if (opts.outdent || opts.indent) {
    text = text.map(EX.redentOneLine.bind(null,
      opts.outdent, (opts.indent || '')));
  }
  if (opts.code !== undefined) {
    text.unshift(EX.markDown.codeBlockQuotes + (opts.code || 'text'));
    text.push(EX.markDown.codeBlockQuotes);
  }
  text.unshift('<!--#verbatim lncnt="' + text.length + '" -->');
  return deliver(null, text.concat('').join('\n'));
};


EX.redentOneLine = function (outdent, indent, ln) {
  if (outdent && ln.startsWith(outdent)) { ln = ln.slice(outdent.length); }
  return (indent + ln);
};


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
  return readme.render(deliver);
};


EX.saveIfRendered = function (readme, whenSaved, renderErr) {
  if (renderErr) { return whenSaved(renderErr, readme); }
  return readme.saveToFile(readme.saveAsFilename, whenSaved);
};
















if (require.main === module) { EX.fromFile('README.md', process); }
