#!/usr/bin/env node

var minimist = require ('minimist');
var jclrz    = require ('json-colorz');
var fs       = require ('fs');
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
	console.log ('        --template (MANDATORY)   : the path to JSON template file');
	console.log ('        --sub (OPTIONAL)         : substitute expression (form => key1=val1,key2=val2 ...)');

	common.print_args ();
	process.exit (1);
};

if (!argv.service || !argv.path || !argv.template)
	usage ();

async function do_the_job () {
	try {
		var template  = fs.readFileSync (argv.template).toString();
		var json_data = fill_template (template);
		var __service = await service.get_one (argv.service);
		var response  = await rest.postJson (`http://${ __service.ServiceAddress}:${__service.ServicePort}${argv.path}`, json_data);
		jclrz (response);
	}
	catch (e) {
		console.error (e);
		process.exit (1);
	}
}

function fill_template (template) {
	if (!argv.sub) {
		/*
		 * No substitution expression supplied. Make sure the template
		 * is free of variables */
		/*if (template.match (/@[a-zA-Z_\-0-9]+/g))
			throw 'error : the template file contains expressions, but no substitution was supplied via "--sub"'
*/
		return JSON.parse (template);
	}

	var subs_arr = argv.sub.split (',');
	var local = {};
	subs_arr.forEach (function (curr, index) {
		if (!curr)
			return;
		var kv = curr.split ('=');
		local[kv[0]] = kv[1];

		var re = new RegExp ('@' + kv[0]);
		template = template.replace (re, kv[1]);
	});

	if (template.match (/@[a-zA-Z_\-0-9]+/g))
		throw 'error : the template file contains still contains unprocessed expressions';

	console.log (template)
	return JSON.parse (template);
}

do_the_job ();
