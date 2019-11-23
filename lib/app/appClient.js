const natsIface      = require ('../nats-iface');
const serviceManager = require ('./serviceManager');
const log            = require ('../../utils/log').child ({ module : 'lib/appClient'});

const appClient = {};

/*
Schema for appConfig

name      -> type : String, MANDATORY, description : Name of the app requesting services, ex : 'Kuiper'
namespace -> type : String, OPTIONAL, description : Use as a prefix for default nats channels, default : '', ex : "namespace"


TODO Shardul
services         -> type : Array, OPTIONAL, description : List of services needed, default : [] (gets all service type), ex : ['user', 'notification']
failureThreshold -> type : Number, OPTIONAL, description : After how many failed calls should a service be deleted, default : 4 , ex : 2
*/

/*
 * Initialise Connection to NATS
 * Init/start Service manager */
appClient.init = async function (appConfig, natsConfig) {
	return new Promise (async function (resolve, reject) {
		try {
			/*
			 * TODO Shardul
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

appClient.getServices = function (which) {
	let services = serviceManager.getServices (which);
	return services;
};

/* Ability to remove service on user request */
appClient.removeService = function (serviceType, serviceId) {
	serviceManager.updateInstance (serviceType, serviceId, 'REMOVE_INSTANCE');
};

/*
 * Ability to increase failure count
 *
 * A service may not be able to send a signal for graceful shutdown
 * let a user manually increase the failure count 
 * service entry will be auto deleted after a fixed number of failures */
appClient.addFailure = function (serviceType, serviceId) {
	serviceManager.updateInstance (serviceType, serviceId, 'ADD_FAILURE');
};

/*
 * TODO Shardul
 * API to decrement failure count
 */
appClient.subtractFailure = function (serviceType, serviceId) {
	log.debug ({serviceType, serviceId}, 'request to decrement failure count for service entry');
	return 'TO BE IMPLIMENTED';
};

/*
 * API to reset failure count
 */
appClient.resetFailure = function (serviceType, serviceId) {
	serviceManager.updateInstance (serviceType, serviceId, 'RESET_FAILURE');
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
