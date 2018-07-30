#!/usr/bin/env node

require('app-module-path').addPath(__dirname + '/../../../');
/*
 * Silence all logs */
require('common/log').level ('error');

var fs       = require ('fs');
var child    = require ('child_process');
var minimist = require ('minimist');
var find     = require ('find');
var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');

var argv = minimist (process.argv.slice(2));

if (!argv._)
	usage ();

var path = argv._[0];
if (!fs.existsSync (path)) {
	console.log (colors.red ('error : ') + `path ${path} not found`);
	process.exit (1);
}

if (argv.help)
	usage ();

async function find_files () {
	var _d = promise.pending ();

	try {
		find.file (path, function (files) {
			_d.resolve (files);
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
}

async function run_test (file) {
	var _d = promise.pending ();

	try {
		child.exec (`${__dirname}/run-test.js ${file}`, function (err, stdout, stderr) {
			_d.resolve ({
				err    : err,
				stderr : stderr
			});
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
}

async function start () {
	try {
		var files = await find_files ();

		for (var i = 0; i < files.length; i++) {
			let file = files[i];

			process.stdout.write (`\r\n${colors.dim ('running scenario')} ${file} ...`);
			var code = await run_test (file);

			if (code.err) {
				process.stdout.write (`\r` + colors.red ('[ error ]') + ` ${file}                       `);
				process.stdout.write (`\r\n${code.stderr}`);
			}
			else
				process.stdout.write (`\r` + colors.green ('[ ok ]') + ` ${file}                       `);
		}

		console.log ('');
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

		process.exit (1);
	}
}

function usage () {
    var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log ('Usage : [node] ' + file + ' [ options ] path');
    console.log ('        --help (OPT)              : print this help');

    process.exit (1);
}

start ();
