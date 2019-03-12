/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, Promise = require('bluebird'),
  unresolve = require('unresolve');

function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }


EX = function (lines, meta) {
  if (!meta.opts.code) { meta.opts.code = 'javascript'; }
  var state = { output: [], copy: false, meta: meta,
    srcFn: String(meta.opts.file || ''),
    };
  return Promise.mapSeries(lines, function (ln, idx) {
    state.input = ln;
    state.lnidx = idx;
    return EX.eatLine(state);
  }).then(function () { return state.output; });
};


EX.eatPrefix = function (st, rx) {
  var m = rx.exec(st.input);
  if (!m) { return false; }
  st.input = st.input.slice(m[0].length);
  return m;
};


EX.eatLine = function (st) {
  var ctrl = EX.eatPrefix(st, /^\s*\/{2} ¦mjsUsageDemo¦\s*/);
  if (!ctrl) {
    if (st.copy) { st.output.push(st.input); }
    return;
  }
  function nextCtrl() {
    if (!st.input) { return; }
    ctrl = EX.eatPrefix(st, /^(\w+|\W)\s*/);
    if (!ctrl) { throw new Error('w00t? neither word nor non-word char?'); }
    ctrl = (ctrl[1] || ctrl[2]);
    var how = EX.ctrl[ctrl];
    if (!ifFun(how)) { throw new Error('Unsupported directive: ' + ctrl); }
    return Promise.try(function () { return how(st); }).then(nextCtrl);
  }
  return nextCtrl();
};


EX.ctrl = {
  '+': function (st) { st.copy = true; },
  '-': function (st) { st.copy = false; },
};


EX.ctrl.importPkgName = function (st) {
  var output = st.output, lastLnIdx = output.length - 1,
    origLn = output[lastLnIdx],
    from = origLn.split(/( from )(['"])((?:\.+(?:\/|(?=['"])))*)/),
    before, after, upPath;
  if (from.length !== 5) {
    throw new Error('Expected exactly one "from" in ' + origLn);
  }
  upPath = from[from.length - 2];
  if (!upPath) {
    throw new Error('Expected a relative path but found: ' + after);
  }
  before = from.slice(0, -2).join('');
  after = from[from.length - 1];
  return unresolve(upPath, { srcFile: st.srcFn }).then(function (id) {
    output[lastLnIdx] = before + id + after;
  });
};









module.exports = EX;
