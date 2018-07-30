require('app-module-path').addPath(__dirname + '/../../../');

var readline = require ('readline');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var protocol = require ('common/protocol');
var parser   = require ('./parser');
var commands = require ('./commands');
var vm       = require ('./vm');

var argv = minimist (process.argv.slice(2));
var executioner = {};
var _rl;

executioner.start = async function (stream_in, stream_out, options) {
	if (stream_in.isTTY)
		return start_readline (stream_in, stream_out, options);

	return start_readfile (stream_in, stream_out, options);
};

var context_main = {
	parent_context : null,
	variables : {},
};

async function start_readfile (stream_in, stream_out, options) {
	var _d = promise.pending ();
	var data = "", chunk;

	stream_in.setEncoding ('utf8');
	stream_in.on ('readable', function() {
		while (chunk = stream_in.read()) {
			data += chunk;
		}
	});

	stream_in.on ('end', async function () {
		var __lines = data.split('\n');
		var lines = [], curr_line = -1, continuation = false;

		/*
		 * this loops handles all lines ending with a '\' and concatenates 
		 * them */
		for (var i = 0; i < __lines.length; i++) {

			if (!continuation && !__lines[i].match (/\s*\\\s*/g)) {
				curr_line++;
				lines.push (__lines[i]);
			}
			else {
				lines[ curr_line ] += ' ' + __lines[i].replace (/\s*\\\s*/g, '');
				if (__lines[i].match (/\s*\\\s*/g))
					continuation = true;
				else
				continuation = false;
			}
		}

		var line_in = {
			lines   : lines,
			start   : 0
		};

		try {
			for (var chunk = spit_lines (line_in); chunk.processed_line; chunk = spit_lines (line_in)) {
				var orig_lines = chunk.orig_lines;
				var processed_line = chunk.processed_line + '\n';

				/*
				 * Show the currently processing original lines */
				orig_lines.forEach (function (curr) {
					console.log (`${colors.green (options.prompt + ' # ')}${curr}`)
				});

				var result = await execute_line (processed_line, context_main);
				if (result && result.exit)
					break;
			}

			_d.resolve ();
		}
		catch (e) {
			_d.reject (e);
		}
	});

	return _d.promise;
};

function spit_lines (__in) {
	var lines = __in.lines;
	var start = __in.start;
	var orig_lines = [];
	var processed_line = '';
	var num_of_lines = 0;
	var state = 'command';

	for (var i = start; i < lines.length; i++) {

		var orig_line = lines[i];
		var line      = lines[i];


		/* preprocess the line */
		line  = line.replace (/^([^# \t]*)[ \t]*#.*$/g, "$1");
		if (!line.length) {
			orig_lines.push (orig_line);
			continue;
		}

		if (state === 'command') {
			if (!line.match (/^[ \t]*-/g)) {
				/* if a line does not start with a '-' ... */
				orig_lines.push (orig_line);
				processed_line += line;
				state = 'sub-command';
				continue;
			}
		} else
			if (line.match (/^[ \t]*-/g)) {
				/* if a line starts with a '-' ... */
				orig_lines.push (orig_line);
				processed_line += line;
				continue;
			}

		__in.start = i;

		if (argv['debug-stream'])
			console.log (colors.dim (`processed_line = ${processed_line}`))

		return {
			orig_lines : orig_lines,
			processed_line : processed_line
		};
	}

	if (argv['debug-stream'])
		console.log (colors.dim (`orig_lines = ${JSON.stringify (orig_lines)}`))

	__in.start = i;
	return {
		orig_lines : orig_lines,
		processed_line : processed_line.length ? processed_line : null
	};
}

async function start_readline (stream_in, stream_out, options) {
	var _d = promise.pending ();

	_rl = readline.createInterface({ 
		input  : stream_in,
		output : stream_out,
		prompt : colors.green (options.prompt + ' # '),
	});

	_rl.prompt ();

	_rl.on ('line', async function (input) {

		_rl.pause ();

		try {
			/*
			 * Remove '#' comments */
			input  = input.replace (/^([^# \t]*)[ \t]*#.*$/g, "$1");
			if (!input.match (/^[ \t]*$/g)) {
				input += '\n';
				await execute_line (input, context_main);
			}

			_rl.prompt ();

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

			_rl.prompt ();
		}
	});

	_rl.on ('SIGINT', function () {
		process.exit(1);
	});

	_rl.on ('close', function () {
		console.log ('');
		_d.resolve ();
	});

	return _d.promise;
};

async function execute_line (line, context) {
	var _d = promise.pending ();
	var result = null;

	try {
		var parsed_line = parser.parse (line);

		if (!argv['parse-only']) {
			result = await vm.exec_one (parsed_line, context);
		}

		_d.resolve (result);
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

module.exports = executioner;
