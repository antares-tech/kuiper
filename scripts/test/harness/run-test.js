#!/usr/bin/env node

require('app-module-path').addPath(__dirname + '/../../../');
/*
 * Silence all logs */
require('common/log').level ('error');

var fs       = require ('fs');
var readline = require ('readline');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var usage    = require ('./usage');
var parser   = require ('./parser');

var argv = minimist (process.argv.slice(2));

if (!argv._.length)
	usage ();

if (argv.help)
	usage ();

/*
 * Fill the store */
var name = 'P-Node';
store.set ('id',                           'usher-harness');
store.set ('name',                         name);
store.set ('name-pretty',                  'Presence Node');
store.set ('desc',                         'Agents connect to me');
store.set ('tags',                         [ 'application', '3A' ]);
store.set ('type',                         'harness');
store.set (`config/harness/${name}/host`, 'localhost');

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
		var scene_file = argv._[0];
		var stream     = fs.createReadStream (scene_file);

		await init ();
		await exec.start (stream, process.stdout, {
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

		console.error (colors.red ('error : '), err);
		if (e.stack)
			console.error (e.stack);

		console.error (colors.red ('test failed'));
		process.exit (1);
	}
}

start ();
