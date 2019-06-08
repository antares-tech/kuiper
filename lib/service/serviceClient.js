const serviceAnnouncer = require ('./serviceAnnouncer');
const natsIface        = require ('../nats-iface');
const log              = require ('../../utils/log').child ({ module : 'lib/serviceClient'});

const serviceClient    = {};

/*
 * Initialise Connection to NATS
 * Init/start Service manager */
serviceClient.init = async function (serviceConfig, natsConfig) {
	/*
	 * TODO
	 * Decide upon args for this function
	 * Store defaults to a proper place */

	/*
	 * TODO
	 * Where will the validity of this serviceConfig checked?
	 * Here or down stream?
	 * design decision */

	return new Promise (async function (resolve, reject) {
		try {
			/*
			 * TODO
			 * Passing confi transparently
			 * do proper handling */
			await natsIface.init (natsConfig);
			await serviceAnnouncer.init (serviceConfig);
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
