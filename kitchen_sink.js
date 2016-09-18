/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports;

EX.multiMarkSplit = function (text, mark, idx) {
  if (!mark) { return text; }
  text = text.split(new RegExp(String(mark).replace(/(\W)/g, '\\$1'
    ).replace(/\\\x00/g, '|'), ''));
  if (idx === undefined) { return text; }
  if (idx < 0) { idx += text.length; }
  return text[idx];
};


EX.defaultProp = function (obj, prop, defaultValue, unsetValue) {
  var val = obj[prop];
  if (val === unsetValue) { val = obj[prop] = defaultValue; }
  return val;
};








/*scroll*/
