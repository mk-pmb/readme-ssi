/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, allCmd = require('./all_cmd.js');

EX.cmd = {};

EX.cmd.verbatim = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
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
      '&,': allCmd.markDown.codeBlockQuotes,
    }[tag.rawAttrs.until] || until);
  }
  text = tag.try(allCmd.replaceUntilMark, [buf]);
  text += buf.eatLine();
  return text;
};


EX.checkEat = function (renderer, buf) {
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










/*scroll*/
