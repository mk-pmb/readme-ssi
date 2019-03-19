/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, SsiLikeFile = require('render-ssi-like-file-pmb');

EX.defaultReplaceEndMark = /^[ \t]*<\!\-{2}/;

EX.markDown = {
  codeBlockQuotes: '```',
};


EX.cmd = {
  '>prefix': '!--#',
  '>suffix': ' --',
  '>before': function prepareCmd(text, tag, buf) {
    var lineRemainder = buf.peekLine();
    if (lineRemainder) {
      tag.origText += lineRemainder;
      buf.eat();
    }
    return text;
  },
  '>after': function finishCmd(text, tag) {
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
  },
};


EX.preserveOrigText = function (tag, text) {
  text = (tag.origText || '<!-- !! no origText?? !! -->\n') + text;
  return text;
};


EX.replaceUntilMark = function (buf, mark) {
  if (mark === undefined) { mark = EX.defaultReplaceEndMark; }
  return buf.eatLinesBeforeMark(mark);
};









module.exports = EX;
