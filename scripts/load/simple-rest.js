#!/usr/bin/env node

var stats    = require("stats-lite");
var format   = require("format-number");
var minimist = require ('minimist');
var moment   = require ('moment');
var colors   = require ('colors');
var rest     = require ('./rest');

var argv = minimist (process.argv.slice(2));

function usage () {
	var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log ('Usage : [node] ' + file + ' [ common-options ]');
	console.log ('        --host (MANDATORY)       : target host');
	console.log ('        --path (MANDATORY)       : target path');
	console.log ('        --burst (MANDATORY)      : burst (req/sec)');
	console.log ('        --proto (OPTIONAL)       : https | http (defaults to http)');

	process.exit (1);
}

if (!argv.host || !argv.path || !argv.burst)
	usage ();

/*
 * Set defaults */
if (!argv.proto)
	argv.proto = 'http';

var map = {};
var counter=1;
var start, end;
var periodic_timer;

function run_load () {
	start = moment ();
	var iterator = burst (argv.burst, 1000);

	periodic_timer = setInterval (() => {
		iterator.next ();
	}, 1000);
}

function* burst (burst_size, burst_duration) {
	var iteration = 1;
	while (true) {
		var burst_start = moment ();
		var rest_client = new rest (`${argv.proto}://${argv.host}`);

		for (var i = 0; i < burst_size; i++) {
			var __p = rest_client.get (argv.path, { context : `${iteration}:${i}`});
			__p.then (
				mark_success.bind(null, counter),
				mark_failure.bind(null, counter)
			);

			map [ counter.toString() ] = {
				promise : __p,
				index   : counter,
				start   : moment (),
				status  : 'initiated'
			};

			counter++;
		}

		var burst_end = moment ();
		var actual_burst_duration = burst_end.diff (burst_start);

		if (actual_burst_duration > burst_duration) 
			console.log (colors.red (`burst iteration ${iteration} : bad : duration exceeded ${actual_burst_duration} vs allowed ${burst_size}`));
		else
			console.log (`burst iteration ${iteration} of size ${burst_size} done`);
		yield iteration++;
	}
}

function mark_success (index, result) {
	var entry = map [ index.toString() ];

	entry.status = "done";
	entry.end = moment ();
}

function mark_failure (index, result) {
	var entry = map [ index.toString() ];

	entry.status = "error";
	entry.end = moment ();
}

process.on ('SIGINT', show_stats);
//process.on ('beforeExit', show_stats);

function show_stats () {
	clearInterval (periodic_timer);
	end = moment ();
	var arr_ok = [], arr_err = [], arr_unfinished = [];

	for (var key in map) {
		var entry = map [key];

		if (entry.status === 'done') {
			arr_ok.push (entry.end.diff (entry.start));
		}
		else if (entry.status === 'error') {
			arr_err.push (entry.end.diff (entry.start));
		}
		else {
			arr_unfinished.push (entry);
		}
	}

	var __format = format ({ 
		integerSeparator  : ',',
		decimalsSeparator : ',',
		truncate          : 2
	});

	var test_duration = end.diff(start);
	var total_reqs = arr_ok.length + arr_err.length;

	console.log (`Duration  ${format_duration(test_duration)}`);
	console.log (`Effective Req/sec => ${__format(total_reqs * 1000/test_duration)}`);
	console.log (`Requests OK        : ${arr_ok.length.toLocaleString()}`);
	console.log (`  Mean R.Time      : ${__format(stats.mean(arr_ok))} ms`);
	console.log (`  Median R.Time    : ${__format(stats.median(arr_ok))} ms`);
	console.log (`  Variance         : ${__format(stats.variance(arr_ok))} ms`);
	console.log (`  Min              : ${__format(Math.min.apply(null, arr_ok))} ms`);
	console.log (`  Max              : ${__format(Math.max.apply(null, arr_ok))} ms`);
	console.log (`Requests Failed    : ${arr_err.length.toLocaleString()}`);
	console.log (`Requests Unfinshed : ${arr_unfinished.length.toLocaleString()}`);

	process.exit (0);
}

function format_duration (ms) {
	var m = moment.duration (ms);
	var __format = format ({ 
		padLeft           : 2
	});

	return `${__format(m.hours())}:${__format(m.minutes())}:${__format(m.seconds())}.${__format(m.milliseconds(), { padLeft : 3})}`;
}

run_load ();
