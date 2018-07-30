/*!
 * colorz <https://github.com/akileez/colorz>
 *
 * Copyright (c) 2015 Keith Williams.
 * Licensed under the ISC license.
 */

var colorz = {}
var styles = {
  // modifiers
  reset         : [0, 0],
  bold          : [1, 22],
  dim           : [2, 22],
  italic        : [3, 23],
  underline     : [4, 24],
  inverse       : [7, 27],
  hidden        : [8, 28],
  strikethrough : [9, 29],
  // foregrounds
  black         : [30, 39],
  gray          : [30, 39],
  grey          : [30, 39],
  red           : [31, 39],
  green         : [32, 39],
  yellow        : [33, 39],
  blue          : [34, 39],
  magenta       : [35, 39],
  cyan          : [36, 39],
  white         : [37, 39],
  // bright foregrounds
  brBlack       : [90, 39],
  brGray        : [90, 39],
  brGrey        : [90, 39],
  brRed         : [91, 39],
  brGreen       : [92, 39],
  brYellow      : [93, 39],
  brBlue        : [94, 39],
  brMagenta     : [95, 39],
  brCyan        : [96, 39],
  brWhite       : [97, 39],
  // backgrounds
  bgBlack       : [40, 49],
  bgGray        : [40, 49],
  bgGrey        : [40, 49],
  bgRed         : [41, 49],
  bgGreen       : [42, 49],
  bgYellow      : [43, 49],
  bgBlue        : [44, 49],
  bgMagenta     : [45, 49],
  bgCyan        : [46, 49],
  bgWhite       : [47, 49],
  // bright backgrounds
  bbBlack       : [100, 49],
  bbGray        : [100, 49],
  bbGrey        : [100, 49],
  bbRed         : [101, 49],
  bbGreen       : [102, 49],
  bbYellow      : [103, 49],
  bbBlue        : [104, 49],
  bbMagenta     : [105, 49],
  bbCyan        : [106, 49],
  bbWhite       : [107, 49]
}

forEach(keys(styles), function (style) {
  var open = '\u001b[' + styles[style][0] + 'm'
  var clos = '\u001b[' + styles[style][1] + 'm'

  colorz[style] = function (msg) {
    return open + msg + clos
  }
})

function strip (str) {
  return str.replace(/(?:\u001b\[)\d+m/g, '')
}

function expose (style, str, noColor) {
  if (typeof str === 'boolean') {
    noColor = str
    str = 'Hello World'
  }

  str = str || 'Hello World'

  return noColor
    ? style + ': ' + JSON.stringify(colorz[style](str))
    : style + ': '
      + JSON.stringify(colorz[style](str))
      .replace(/(\\u001b\[\d+m)/g, colorz[style](['$1']))
}

function keys (obj) {
  var result = []
  var key

  for (key in obj) {
    if (obj.hasOwnProperty(key)) result.push(key)
  }
  return result
}

function forEach (arr, fn) {
  var i = -1
  var len = arr.length

  while (++i < len) if (fn(arr[i], i, arr) === false) break
}

module.exports = colorz
module.exports.strip = strip
module.exports.expose = expose
