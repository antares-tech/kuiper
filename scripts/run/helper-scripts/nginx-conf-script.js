#!/usr/bin/env node

var minimist = require('minimist')
var fs       = require("fs");
var execSync = require('child_process').execSync;
var argv     = minimist (process.argv.slice (2));

var exec_stdout;

function main () {
	if (!argv.template) {
		console.log ('!error : no nginx template file specified');
		process.exit (1);
	}

	try {
		/*
		 * Read the NGINX template file and find all the variables
		 * used
		 */
		var content = fs.readFileSync (argv.template, "utf8");
		var regex   = new RegExp (/@[a-zA-Z0-9_]+/g);
		var matches = content.match (regex);

		/*
		 * Replace all the variables with actual values
		 */
		for (var i = 0; i < matches.length; i++) {
			var variable = matches[i].replace(/^@/g, '');

			if (!argv [ variable ]) {
				console.log (`!error : variable "@${variable}" required by NGINX template file ${argv.template} not defined at the command line`);
				process.exit (1);
			}

			content = content.replace (matches[i], argv[variable]);
		}

		var pid            = process.pid;
		var temp_conf_file = "/tmp/nginx-conf-file." + pid;

		fs.writeFileSync (temp_conf_file, content, "utf8");

		exec_stdout = execSync (`sudo mv ${temp_conf_file} /etc/nginx/sites-available/kuiper`);
		exec_stdout = execSync (`sudo bash -c 'cd /etc/nginx/sites-enabled; ln -sf ../sites-available/kuiper default'`);

		process.exit (0);

	} catch (e) {
		console.log ('error : ', e);

		if (exec_stdout) {
			console.log (`!error : moving ${temp_conf_file} to "/etc/nginx/sites-available/kuiper" failed`);
			console.log (`-----------`);
			console.log (`>>>> STDOUT`);
			console.log (`${exec_stdout}`);
			console.log (`<<<< STDOUT`);
		}

		process.exit (1);
	}
}

main();
