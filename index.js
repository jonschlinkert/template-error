'use strict';

var fs = require('fs');
var lazy = require('lazy-cache')(require);
lazy.template = lazy('lodash.template');
lazy.typeOf = lazy('kind-of');
lazy.rethrow = lazy('rethrow')();

function error(str, options) {
  options = options || {};

  var fp = options.fp || 'string';
  var data = options.data || {};
  var re = options.regex || /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|\$\{([^\\}]*(?:\\.[^\\}]*)*)\}|<%([\s\S]+?)%>|$/g;
  var regex = toRegexp(re);

  str.replace(regex, function(match, prop, i) {
    var rethrow = lazy.rethrow();
    var render = lazy.template();

    try {
      render(str)(data);
    } catch (err) {
      var prop = matchProp(err.message);
      var match = findProp(prop, str, regex);
      var before = str.slice(0, match.index);
      var lineno = before.split('\n').length;
      rethrow(err, fp, lineno, str);
    }
  });
};

function matchProp(str) {
  var re = /(\w+) is not defined/;
  var m = re.exec(str);
  if (!m) return;
  return m[1];
}

function findProp(prop, str, re) {
  var src = re.source;
  var left = /^([-{<\[=%]+)/.exec(src);
  var esc = '(?:[' + left[0].split('').join('\\') + '\\s]+)';
  var delim = esc + '.*' + prop;
  var re = new RegExp(delim, 'm');
  return re.exec(str);
}

function toRegexp(val) {
  var typeOf = lazy.typeOf();
  if (typeOf(val) === 'regexp') {
    return val;
  }
  if (typeOf(val) === 'object') {
    return val.interpolate;
  }
}

function toSettings(val) {
  var typeOf = lazy.typeOf();
  if (typeOf(val) === 'regexp') {
    return { interpolate: val };
  }
  if (typeOf(val) === 'object') {
    return val;
  }
  return null;
}

/**
 * Expose `error`
 */

module.exports = error;
