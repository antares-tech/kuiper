'use strict';

function isObject(thing) {
  return thing !== null && typeof thing === 'object'
}

function isString(thing) {
  return typeof thing === 'string' || thing instanceof String;
}

module.exports = {
  isObject: isObject,
  isString: isString
};
