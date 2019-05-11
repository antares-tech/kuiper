const natsIface      = require ('./nats-iface');
const serviceManager = require ('./serviceManager');
const log            = require ('./log').child ({ module : 'lib/appClient'});
const appClient = {};

/*
 * Initialise Connection to NATS
 * Init/start Service manager */
appClient.init = async function (appConfig, natsConfig) {
	/*
	 * TODO
	 * Decide upon args for this function
	 * Store defaults to a proper place */

	/*
	 * TODO
	 * Where will the validity of this natsConfig checked?
	 * Here or down stream?
	 * design decision */

	return new Promise (async function (resolve, reject) {
		try {
			/*
			 * TODO
			 * Passing confi transparently
			 * do proper handling */
			await natsIface.init (natsConfig);
			await serviceManager.init (appConfig, natsConfig);
		}
		catch (err) {
			log.error ({err : err}, 'appClient init error');
			reject (err);
		}
		resolve ();
	});
};

appClient.getServices = function (/*which*/) {
	let services = serviceManager.getServices ();
	return services;
};

/*
 * Close connection to NATS
 * Stop service manager */
appClient.deinit = function () {
	/*
	 * TODO 
	 * Discuss args accepted */
};

module.exports = appClient;
