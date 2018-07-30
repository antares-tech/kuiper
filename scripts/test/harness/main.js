#!/usr/bin/env node

require('app-module-path').addPath(__dirname + '/../../../');
/*
 * Silence all logs */
require('common/log').level ('error');

var readline = require ('readline');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var usage    = require ('./usage');
var parser   = require ('./parser');

var argv = minimist (process.argv.slice(2));

if (argv.help)
	usage ();

/*
 * Fill the store */
var name = 'harness';
store.set ('id',                           'harness');
store.set ('name',                         name);
store.set ('name-pretty',                  'Test Harness');
store.set ('desc',                         'Test harness');
store.set ('tags',                         [ 'application', '3A' ]);
store.set ('type',                         'harness');
store.set (`config/harness/${name}/host`,  'localhost');

var nats_if  = require ('common/nats-if');
var exec     = require ('./executioner');

async function init () {
	var _d = promise.pending ();

	try {
		await parser.init ();
		_d.resolve ();
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
}

async function start () {
	try {
		await init ();
		await exec.start (process.stdin, process.stdout, {
			prompt : 'harness'
		});

		console.log (colors.green ('test passed'));
		process.exit (0);
	}
	catch (e) {
		var err = e;

		if (e instanceof Error)
			err = e.message;
		else if (typeof e === "object")
			err = JSON.stringify (e, null, 2);

		console.log (colors.red ('error : '), err);
		if (e.stack)
			console.log (e.stack);

		console.log (colors.red ('test failed'));
		process.exit (1);
	}
}

start ();
