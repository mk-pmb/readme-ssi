/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, allCmd = require('./all_cmd.js'),
  wordWrap = require('./ersatz_wordwrap.js');

EX.cmd = {};

EX.cmd.echo = function (text, tag, buf) {
  if (text) { tag.err('unexpected input text'); }
  tag.try(allCmd.replaceUntilMark, [buf]);
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
  if (opts.wrap) { data = wordWrap(data, opts.wrap); }
  if (data && opts.underline) {
    data += '\n' + data.replace(/\S|\s/g, opts.underline
      ).substr(0, data.length);
  }
  if (data) { data += '\n'; }
  return deliver(null, data);
};








/*scroll*/
