#!/usr/bin/env node

var moment     = require ('moment');
var minimist   = require ('minimist');
var jclrz      = require('json-colorz');
var fs         = require ('fs');
var colors     = require ('colors');
var promise    = require ('bluebird');
var nats       = require ('../lib/nats');
var yaml       = require ('js-yaml');

var nats;

var argv = minimist (process.argv.slice(2));

function usage () {
	var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log ('Usage : cat <message-file> | [node] ' + file + ' --ch <channel-name>');
	console.log ('        --ch (MANDATORY)      : channel name');
	console.log ('        --timeout (OPTIONAL)  : timeout');

	process.exit (1);
};

if (!argv.ch)
	usage ();

var channel = argv.ch;

function read_stdin () {
	var inputChunks = [];
	var p = promise.pending ();

	try {
		console.log ('[reading from stdin ...]');
		process.stdin.resume ();
		process.stdin.setEncoding('utf8');

		process.stdin.on ('data', function (chunk) {
			inputChunks.push(chunk);
		});

		process.stdin.on('end', function () {
			var inputYAML = inputChunks.join();
			var parsedData;

			try {
				parsedData = yaml.safeLoad (inputYAML);
				console.log (colors.dim ('>>>>>>>>  (start of request PDU) >>>>>>>>\n'));
				console.log (colors.dim (JSON.stringify (parsedData, null, 2)));
				console.log (colors.dim ('\n>>>>>>>>  (end of  request  PDU) >>>>>>>>\n'));
			} catch (e) {
				console.error ('YAML parse error : ' + e.message);
				console.error (e.stack);
				process.exit (1);
			}

			p.resolve (parsedData);
		});
	}
	catch (e) {
		console.error (e);
		if (e.stack)
			console.error (e.stack);
		process.exit (1);
	}

	return p.promise;
}

/*
 * A utility "sleep" function
 */
async function sleep (timeout) {
	var _d = promise.pending ();

	setTimeout (() => _d.resolve(), timeout);
	return _d.promise;
}

async function doit (parsedData) {
	var _d = promise.pending ();
	var timeout = argv.timeout || 2000;

	try {
		await nats.connect ();

		parsedData.header.ts = moment().toISOString();
		var response = await nats.requestOne (channel, JSON.stringify (parsedData), {}, timeout);

		if (response.code)
			/*
			 * This is likely an error */
			throw response;

		console.log (colors.green ('\n>>>>>> (response) >>>>>>\n'));
		jclrz (JSON.parse (response));

		_d.resolve ();
	}
	catch (e) {
		console.log (colors.red ('error : '), JSON.stringify (e, null, 2));
		_d.reject ();
	}

	return _d.promise;
}

read_stdin ()
	.then (doit.bind(null))
	.then (function () {
		process.exit();
	})
	.catch (function (e) {
		process.exit (1);
	});
