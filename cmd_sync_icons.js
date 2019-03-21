/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, coreCmds = require('./core_cmds.js'),
  iconDefRgx = /^\s*\[([\w\-\.]+)\]:\s+\w+:\S+\s+"(\S+)"\s*$/,
  iconUseRgx = /!\[[ -Z\^-\uFFFF]*\]\[([ -Z\^-~]+)\]/g;

EX.cmd = {};

EX.cmd['sync-icons'] = function (text, tag, buf) {
  if (text) { throw tag.err('unexpected input text'); }
  var renderer = this, iconAlts = Object.create(null),
    iconListText = tag.try(coreCmds.replaceUntilMark, [buf]);

  function maybeIcon(ln) {
    ln = iconDefRgx.exec(ln);
    if (!ln) { return; }
    iconAlts[ln[1]] = ln[2];
  }
  iconListText.split(/\n/).forEach(maybeIcon);

  function syncIconsNow(readme, whenSynced) {
    EX.syncNow(readme, iconAlts);
    whenSynced(null);
  }
  renderer.postFx.push(syncIconsNow);
  return iconListText;
};


EX.syncNow = function (readme, iconAlts) {
  function upd(orig, ref) {
    var alt = iconAlts[ref];
    if (!alt) { return orig; }
    return ('![' + alt + '][' + ref + ']');
  }
  readme.text = readme.text.replace(iconUseRgx, upd);
};










module.exports = EX;
