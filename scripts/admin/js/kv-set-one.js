#!/usr/bin/env node

var minimist = require ('minimist');
var jclrz    = require('json-colorz');
var colors   = require ('colors');
var consul   = require ('./consul');

var argv = minimist (process.argv.slice(2));

function usage () {
	var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log (`Usage : ${file} <key> <value>`);
	process.exit (1);
}

var key = process.argv[2];
var val = process.argv[3];
if (!key || !val)
	usage ();

async function do_the_job () {
	try {
		var response  = await consul.set_key (key, val);
		console.log (`set ${colors.green(key)} -> ${val}`);
	}
	catch (e) {
		console.error (e);
		process.exit (1);
	}
}

do_the_job ();
