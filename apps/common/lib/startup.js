var promise     = require ('bluebird');
var moment      = require ('moment');
var banner      = require (`../banner`);
var kv          = require (`../../../common/kv`);
var store       = require ('../../../common/store');
var nats        = require (`../../../common/nats-bunyan-connect`).promise;

var startup = {};
var log;

startup.init = async function (args) {
	let _d = promise.pending ();
	/*
	 * Do common app startup tasks depending on given args */

	try {
		/*
		 * Store basic inforamation about the application
		 * for other modules to use */
		store.set ('name',        args.name);
		store.set ('name-pretty', args.name_pretty);
		store.set ('desc',        args.desc);
		store.set ('type',        'app');
		store.set ('start_ts',    moment().toISOString());
		store.set ('log_level',   args.log || 'debug');

		await nats;

		log = require ('../../../common/log');
		/*
		 * needs to be initialised after log init */
		var nats_iface  = require (`../../../common/nats-iface`);
		await nats_iface.init();

		log.info (banner);

		await kv.get_and_store (`config/global/`,           { recurse : true });
		await kv.get_and_store (`config/app/global/`,       { recurse : true });
		await kv.get_and_store (`config/app/${args.name}/`, { recurse : true });

		_d.resolve(log);
	}
	catch (err) {
		_d.reject (err);
	}

	return _d.promise;
};


module.exports = startup;


