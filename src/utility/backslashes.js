// Copyright (C) 2018 Josh Ventura
// This code is distributed under the GNU General Public License, Version 3.
// You may use, modify, and distribute it per the terms of that license.

function isOct(c) {
  c = c.charCodeAt(0);
  return c >= '0'.charCodeAt(0) && c < '8'.charCodeAt(0);
}
function isHex(c) {
  c = c.charCodeAt(0);
  return c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0) ||
         c >= 'a'.charCodeAt(0) && c <= 'f'.charCodeAt(0) ||
         c >= 'A'.charCodeAt(0) && c <= 'F'.charCodeAt(0);
}

function unescape(string) {
  var res = "";
  for (let i = 0; i < string.length; ++i) {
    if (string[i] == '\\') {
      switch (string[++i]) {
        case 'b': res += '\b'; break;
        case 'f': res += '\f'; break;
        case 'n': res += '\n'; break;
        case 'r': res += '\r'; break;
        case 't': res += '\t'; break;
        
        // Octal escape
        case '0': case '1': case '2': case '3': case '4': case '5': case '6':
        case '7': {
          let j = 1;
          while (j < 3 && i + j < string.length && isOct(string[i + j])) ++j;
          res += String.fromCharCode(parseInt(string.substr(i, j), 8));
          i += j - 1;
          break;
        }
        
        // Unicode escape
        case 'u': {
          ++i;
          let j = 1;
          while (j < 4 && i + j < string.length && isHex(string[i + j])) ++j;
          res += String.fromCharCode(parseInt(string.substr(i, j), 16));
          i += j - 1;
          break;
        }
        
        // Hex escape
        case 'x': {
          ++i;
          let j = 1;
          while (j < 2 && i + j < string.length && isHex(string[i + j])) ++j;
          res += String.fromCharCode(parseInt(string.substr(i, j), 16));
          i += j - 1;
          break;
        }
        
        default:
        res += '\\' + string[i];
      }
    } else {
      res += string[i];
    }
  }
  return res;
}

function escape(str) {
  let res = "";
  for (const c of str) {
    if (c == "'" || c == '"' || c == '\\') res += '\\' + c;
    else if (c == '\b') res += '\\b';
    else if (c == '\f') res += '\\f';
    else if (c == '\n') res += '\\n';
    else if (c == '\r') res += '\\r';
    else if (c == '\t') res += '\\t';
    else res += c;
  }
  return res;
}

exports.unescape = unescape;
exports.escape = escape;
