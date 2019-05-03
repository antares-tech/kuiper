require('app-module-path').addPath(__dirname + '/../../');

var colors = require ('colors');
var moment = require ('moment');
var nats   = require ('common/nats-bunyan-connect').promise;
var kv     = require ('common/kv');
var store  = require ('common/store');
var banner = require ('services/common/lib/banner');

var name  = 'user';

async function start () {

	try {
		/*
		 * Store basic inforamation about the application
		 * for other modules to use */
		store.set ('name',        name);
		store.set ('name-pretty', 'User Microservice');
		store.set ('id',          require ('uuid/v1')());
		store.set ('desc',        'The core microservice for all things related to users');
		store.set ('tags',        [ 'service', '3A' ]);
		store.set ('type',        'srv');
		store.set ('start_ts',    moment().toISOString());
		store.set ('app_js',      __dirname + '/app.js');
		store.set ('args_js',     __dirname + '/args.js');

		/*
		 * Check arguments */
		args = require ('services/common/lib/args');

		/*
		 * Initialize log */
		await nats;
		store.set ('log_level',   args.argv.log || 'debug');
		log  = require ('common/log');

		log.info (banner);

		await kv.get_and_store (`config/global`,      { recurse : true });
		await kv.get_and_store (`config/srv/global`,  { recurse : true });
		await kv.get_and_store (`config/srv/${name}`, { recurse : true });

		require ('services/common/lib/start')();
	}
	catch (e) {
		console.error (colors.red ('fatal error : ') + e.message || e);

		if (e.stack)
			console.error (e.stack);

		process.exit (1);
	}
}

start ();
