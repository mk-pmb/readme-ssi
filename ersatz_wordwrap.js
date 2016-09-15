/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = function ersatzWordWrap(text, width) {
  var wrapped = '', curLen = 0, word;
  text = String(text).replace(/\r/g, '').replace(/\t/, EX.tab2spaces
    ).replace(/ +(\n|$)/g, '$1');
  while (text.length) {
    word = text.match(/^(?:(\n+)|(\s*)(\S+))/);
    if (!word) { break; }
    text = text.slice(word[0].length);
    if (word[1]) {
      wrapped += word[1];
      curLen = 0;
    } else {
      if (curLen === 0) {
        wrapped += word[0];
        curLen = word[0].length;
      } else {
        curLen += word[0].length;
        if (curLen > width) {
          wrapped += '\n' + word[3];
          curLen = word[3].length;
        } else {
          wrapped += word[0];
        }
      }
    }
  }
  wrapped += text;
  return wrapped;
};


EX.tab2spaces = '\u240B';







module.exports = EX;
