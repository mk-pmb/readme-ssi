/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, SsiLikeFile = require('render-ssi-like-file-pmb');

EX.cmd = require('./all_cmd.js');


EX.fromFile = function (srcFn, deliver) {
  EX.fromFileToFile(srcFn, false, deliver);
};


EX.fromFileToFile = function (srcFn, saveAs, whenSaved) {
  var readme = new SsiLikeFile(), whenRendered = whenSaved;
  readme.normalizeWhitespace = true;
  readme.filename = srcFn;
  readme.commands = EX.cmd;
  readme.postFx = [];
  readme.lateFx = [];
  if (+process.env.DEBUGLEVEL > 2) {
    readme.log = console.error.bind(console);
  }
  if (saveAs) {
    whenRendered = function saveIfRendered(renderErr) {
      if (renderErr) { return whenSaved(renderErr, readme); }
      return readme.saveToFile(saveAs, whenSaved);
    };
  }
  readme.render(whenRendered);
};

















module.exports = EX;
