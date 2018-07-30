#!/usr/bin/env node

var minimist = require ('minimist');
var jclrz    = require('json-colorz');
var common   = require ('./common');
var colors   = require ('colors');
var rest     = require ('./rest');
var service  = require ('./service');

var argv = minimist (process.argv.slice(2));

function usage () {
	var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	console.log ('Usage : [node] ' + file + ' --service name [ common-options ]');
	console.log ('        --service (MANDATORY)    : service name');
	console.log ('        --path (MANDATORY)       : the path portion of the url');

	common.print_args ();
	process.exit (1);
}

if (!argv.service || !argv.path)
	usage ();

async function do_the_job () {
	try {
		var __service = await service.get_one (argv.service);
		var response  = await rest.get ("http://" + __service.ServiceAddress + ':' + __service.ServicePort + argv.path)
		jclrz (response);
	}
	catch (e) {
		console.error (e);
		process.exit (1);
	}
}

do_the_job ();
