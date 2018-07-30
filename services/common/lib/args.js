var minimist  = require('minimist');
var colors    = require('colors');
var wrap      = require('wordwrap')(43, 80)
var sprintf   = require('sprintf');
var store     = require('common/store');

var args = minimist(process.argv.slice(2));

var standard_arguments = [
	{
		name      : 'dev',
		desc      : 'development environment. Sets defaults for host. Absence of this implies the environment is production.',
		mandatory : false,
		value     : false
	},
	{
		name      : 'host',
		desc      : '(production env) host IP address of the microservice. Mandatory if --dev option is not set',
		mandatory : false,
		value     : true
	},
	{
		name      : 'help',
		desc      : 'prints this help',
		mandatory : false,
		value     : false
	},
	{
		name      : 'log',
		desc      : 'set the log level (default : info). Possible values : error, warn, info, debug, trace',
		mandatory : false,
		value     : [ 'error', 'warn', 'info', 'debug', 'trace' ]
	},
];

function check_standard_args () {

	if (!__check (standard_arguments))
		return usage (null, standard_arguments);

	/*
	 * Further special checks */
	if (args.dev) {
		/*
		 * DEVELOPMENT ENVINRONMENT
		 */

		if (!args.host)
			/*
			 * Default to localhost _if_ host not specified */
			args.host = '127.0.0.1';
	}
	else {
		/*
		 * PRODUCTION ENVINRONMENT
		 */

		if (!args.host) {
			console.error ('insufficient arguments : --host missing. Aborting.');
			usage (null, standard_arguments);
		}
	}
}

function check_app_args (app_args) {

	if (!__check (app_args))
		return usage (app_args, standard_arguments);
}

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

var app_args;
check_standard_args ();
try {
	app_args = require (store.get('args_js'));
}
catch (e) {
	console.error (colors.red (`error loading service js file (path=${app_args}, error=${e})`));
	process.exit (1);
}
check_app_args (app_args);

module.exports = { check_standard : check_standard_args, check_app : check_app_args, argv : args };;
