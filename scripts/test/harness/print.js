var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var protocol = require ('common/protocol');

var print = {};
var prefix = '    ';

print.print = async function (options, args) {
	var _d = promise.pending ();
	var expr = args && args.expr

	try {

		if (typeof expr === 'object')
			expr = stringify (expr, null, 2).replace (/^/g, prefix).replace (/\n/g, '\n' + prefix);
		else
			expr = prefix + expr;

		console.log (colors.white (expr));

		_d.resolve ({
			request        : null,
			response       : null,
			return_value   : false,
			callback_event : null,
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

print.stringify = stringify;

/*
 * Code copy pasted from https://github.com/isaacs/json-stringify-safe/blob/master/stringify.js */

function stringify (obj, replacer, spaces, cycleReplacer) {
	return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer (replacer, cycleReplacer) {
	var stack = [], keys = []

	if (cycleReplacer == null) cycleReplacer = function(key, value) {
		if (stack[0] === value) return "[Circular ~]"
		return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
	}

	return function(key, value) {
		if (stack.length > 0) {
			var thisPos = stack.indexOf(this)
			~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
			~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
			if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
		}
		else stack.push(value)

		return replacer == null ? value : replacer.call(this, key, value)
	}
}

module.exports = print;
