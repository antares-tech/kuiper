require('app-module-path').addPath(__dirname + '/../../../');

var colors      = require ('colors');
var moment      = require ('moment');
var nats        = require (`common/nats-bunyan-connect`).promise;
var kv          = require ('common/kv');
var store       = require ('common/store');
var args        = require ('apps/common/args').argv;
var banner      = require ('apps/common/banner');
var startup     = require (`apps/common/lib/startup`);

var name  = args.name, log;

async function start () {

	try {
		/*
		 * Store basic inforamation about the application
		 * for other modules to use */
		args.name_pretty = 'Authentication Gateway (Heimdallr)';
		args.desc        = 'Ring of Fire';

		/*
		 * Common startup file for all apss */
		log = await startup.init(args);

		log.info (`starting ${name} @ port # ` + store.get (`config/app/${name}/port`));
		log.info ({ args : JSON.stringify (args) }, 'arguments');

		require ('./www');
	}
	catch (e) {
		console.error (colors.red ('fatal error : ') + e);
		if (e.stack)
			console.error (e.stack);

		process.exit (1);
	}
}

start ();
