const natsIface        = require ('./nats-iface');
const serviceAnnouncer = require ('./serviceAnnouncer');
var log                = require ('./log').child ({ module : 'lib/serviceClient'});
const serviceClient    = {};

/*
 * Initialise Connection to NATS
 * Init/start Service manager */
serviceClient.init = async function (config) {
	/*
	 * TODO
	 * Decide upon args for this function
	 * Store defaults to a proper place */

	/*
	 * TODO
	 * Where will the validity of this config checked?
	 * Here or down stream?
	 * design decision */

	return new Promise (async function (resolve, reject) {
		try {
			/*
			 * TODO
			 * Passing confi transparently
			 * do proper handling */
			await natsIface.init ();
			await serviceAnnouncer.init (config);
		}
		catch (err) {
			log.error ({err : err}, 'serviceClient init error');
			reject (err);
		}
		resolve ();
	});
};

/*
 * Close connection to NATS
 * Stop service manager */
serviceClient.deinit = function () {
	/*
	 * TODO 
	 * Discuss args accepted */
};

module.exports = serviceClient;
