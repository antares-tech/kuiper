#!/usr/bin/env node

var fs       = require ('fs');
var minimist = require ('minimist');
var parseJson= require ('parse-json');
var jclrz    = require ('json-colorz');
var colors   = require ('colors');
var consul   = require ('./consul');
var yaml     = require ('js-yaml');

var argv = minimist (process.argv.slice(2));

function usage () {
	var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log ('Usage : ' + file + ' --profile path');
	console.log ('        --profile (MANDATORY)    : path of the profile file');
	console.log ('        --proto   (OPTIONAL)     : protocol to use');
	console.log ('        --host    (OPTIONAL)     : host name of the machine');
	console.log ('        --port    (OPTIONAL)     : port number of the machine');
	console.log ('        --proxy   (OPTIONAL)     : specify to set proxy');
	
	process.exit (1);
}

var proto = argv.proto;
var host  = argv.host;
var port  = argv.port;
var path  = argv.profile;
var proxy = argv.proxy;

if (!path)
	usage ();

var regex = new RegExp (/=[a-zA-Z0-9]+=/g);
var options = {
	'host'  : host ? host : 'localhost',
	'port'  : port ? port : '443',
	'proto' : proto ? proto : 'http',
	'proxy' : proxy ? 'true' : 'false'
};

async function do_the_job () {
	try {
		var json = yaml.safeLoad(fs.readFileSync(path, 'utf8'));

		for (var key in json) {
			var matches = null;
			var _val = json[key];

			if (typeof _val === 'string') {

				matches = _val.match (regex);

				if (matches) {
					for (var i = 0; i < matches.length; i++) {
						var option_key = matches[i].replace (/=/g, '');
						if (!options [option_key]) {
							console.error (`unrecognized variable ${matches[i]} in template`);
							process.exit (1);
						}

						_val = _val.replace (matches[i], options[option_key]);
					}
				}
			}

			var val = _val;

			var response  = await consul.set_key (key, val);
			console.log (`+ ${colors.green(key)} -> ${val}`);
		}
	}
	catch (e) {
		console.error (e);
		process.exit (1);
	}
}

do_the_job ();
