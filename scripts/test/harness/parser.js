/*
 * Silence all logs */
//require('common/log').level ('fatal');

var promise  = require ('bluebird');
var colors   = require ('colors');
var fs       = require ('fs');
var minimist = require ('minimist');
var jison    = require ('jison');

var argv = minimist (process.argv.slice(2));
var grammar = `${__dirname}/grammar-v2.jison`;

/*
 * Basic checks */
if (argv.grammar)
	grammar = argv.grammar;

/*
 * Set shared context */
var yy = {
	log : function () {}
};

if (argv['debug-grammar'])
	yy.log = parser_log;

var parser = {};
var __parser_h;

parser.init = async function (stream_in, stream_out) {
	var _d = promise.pending ();

	try {
		var bnf = fs.readFileSync (grammar, "utf8");
		__parser_h = new jison.Parser (bnf);
		__parser_h.yy = yy;
		_d.resolve ();
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

parser.parse = function (line) {
	return __parser_h.parse (line);
};

function parser_log () {

    // 1. Convert args to a normal array
    var args = Array.prototype.slice.call (arguments);

    // 2. Prepend log prefix log string
    args.unshift (colors.yellow ('  [parser] '));

    // 3. Pass along arguments to console.log
    console.log.apply (console, args);
}
module.exports = parser;
