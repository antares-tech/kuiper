require('app-module-path').addPath(__dirname + '/../../../');

var colors = require ('colors');
var moment = require ('moment');
var nats   = require ('common/nats-bunyan-connect').promise;
var kv     = require ('common/kv');
var store  = require ('common/store');
var args   = require ('apps/common/args').argv;
var banner = require ('apps/common/banner');

var name  = args['name'], log;

async function start () {

	try {
		/*
		 * Store basic inforamation about the application
		 * for other modules to use */
		store.set ('name',        'hello');
		store.set ('name-pretty', 'Hello Application');
		store.set ('desc',        'Hello Application serves as a template app and basically does almost nothing');
		store.set ('type',        'app');
		store.set ('start_ts',    moment().toISOString());
		store.set ('log_level',   args.log || 'debug');

		await nats;
		log = require ('common/log');

		log.info (banner)

		await kv.get_and_store (`config/global`,      { recurse : true });
		await kv.get_and_store (`config/app/global`,  { recurse : true });
		await kv.get_and_store (`config/app/${name}`, { recurse : true });

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
