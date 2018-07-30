var minimist  = require('minimist');
var colors    = require('colors');
var wrap      = require('wordwrap')(43, 80)
var sprintf   = require('sprintf');

var args = minimist(process.argv.slice(2));

var standard_arguments = [
	{
		name      : 'name',
		desc      : 'name of the application or service',
		mandatory : true,
		value     : true
	},
	{
		name      : 'log',
		desc      : 'set the log level (default : info). Possible values : error, warn, info, debug, trace',
		mandatory : false,
		value     : [ 'error', 'warn', 'info', 'debug', 'trace' ]
	},
	{
		name      : 'help',
		desc      : 'prints this help',
		mandatory : false,
		value     : false
	},
];

if (!__check (standard_arguments))
	return usage (null, standard_arguments);

var app_args_js = process.argv[1].replace (/bin\/www/g, 'args.js');
var app_desc;

try {
	app_desc = require (app_args_js);
}
catch (e) {
	console.error ('error : unable to load args.js. Should be at the same level as app.js');
	process.exit (1);
}

if (!__check (app_desc))
	return usage (app_desc, standard_arguments);

function __check (args_desc) {
	
	if (args.help)
		return false;

	for (var i = 0; i < args_desc.length; i++) {
		var desc = args_desc [i];

		if (desc.mandatory && !args [ desc.name ]) {
			console.log (colors.red (` ** Mandatory argument --${desc.name} missing **`));
			return false;
		}

		if (!desc.mandatory && !args [ desc.name ])
			continue;

		if (desc.value) {
			if (typeof args[desc.name] === 'boolean') {
				console.log (colors.red (` ** Argument --${desc.name} missing value **`));
				return false;
			}
		}

		if (typeof desc.value === 'object')
			if (Array.isArray(desc.value) && !check_alternatives (args [ desc.name ], desc.value)) {
				console.log (colors.red (` ** Argument --${desc.name} has an invalid value **`));
				return false;
			}
	}

	return true;
}

function usage (app_desc, standard_desc) {
	console.log ('');
	console.log (`Usage: node ${process.argv[1]} <options>`);
	console.log ('');

	if (app_desc) {
		console.log ('    Application specific options:');
		print_options (app_desc);
		console.log ('');
	}

	if (standard_desc) {
		console.log ('    Common options:');
		print_options (standard_desc);
		console.log ('');
	}

	process.exit (1);
}

function print_options (desc) {
	for (var i = 0; i < desc.length; i++) {
		console.log (sprintf ('        %-32s : ', `--${desc[i].name} (${desc[i].mandatory ? "MAN" : "OPT"})`) + format_description (desc[i].desc));
	}
}

function format_description (str) {
	return wrap (str.replace(/ +/g, ' ')).replace (/^ */g, '');
}

function check_alternatives (arg, options) {
	if (!args)
		return false;

	return options.indexOf (arg) !== -1;
}

module.exports = { argv : args };
