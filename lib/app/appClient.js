const natsIface      = require ('../nats-iface');
const serviceManager = require ('./serviceManager');
const log            = require ('../../utils/log').child ({ module : 'lib/appClient'});

const appClient = {};

/*
Schema for appConfig

name      -> type : String, MANDATORY, description : Name of the app requesting services, ex : 'Kuiper'
namespace -> type : String, OPTIONAL, description : Use as a prefix for default nats channels, default : '', ex : "namespace"


TODO (Not implimented for now)
services -> type : Array, OPTIONAL, description : List of services needed, default : [] (gets all service type), ex : ['user', 'notification']
*/

/*
 * Initialise Connection to NATS
 * Init/start Service manager */
appClient.init = async function (appConfig, natsConfig) {
	return new Promise (async function (resolve, reject) {
		try {
			/*
			 * TODO
			 * validate appConfig */
			await natsIface.init (natsConfig);
			await serviceManager.init (appConfig);
		}
		catch (err) {
			log.error ({err : err}, 'appClient init error');
			reject (err);
			return;
		}
		resolve ();
	});
};

appClient.getServices = function (/*which*/) {
	let services = serviceManager.getServices ();
	return services;
};

/*
 * Close connection to NATS */
appClient.deinit = function () {
	return new Promise (async function (resolve, reject) {
		try {
			await natsIface.deinit ();
		}
		catch (err) {
			log.error ({err : err}, 'appClient deinit error');
			reject (err);
			return;
		}
		resolve ();
	});
};

module.exports = appClient;
