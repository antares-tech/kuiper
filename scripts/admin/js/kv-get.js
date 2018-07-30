#!/usr/bin/env node

var minimist = require ('minimist');
var jclrz    = require('json-colorz');
var colors   = require ('colors');
var consul   = require ('./consul');

var argv = minimist (process.argv.slice(2));

function usage () {
	var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log (`Usage : ${file} [ key or prefix ]`);
	process.exit (1);
}

var key = process.argv[2];

async function do_the_job () {
	try {
		var response  = await consul.get_key (key);
		print_kv (response);
	}
	catch (e) {
		console.error (e);
		process.exit (1);
	}
}

function print_kv (data) {
	if (!data)
		return;

	for (var i = 0; i < data.length; i++) {
		var entry = data[i];
		console.log (`${colors.green(entry.Key)} -> ${entry.Value}`);
	}
}

do_the_job ();
