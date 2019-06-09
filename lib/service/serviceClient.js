const serviceAnnouncer = require ('./serviceAnnouncer');
const natsIface        = require ('../nats-iface');
const log              = require ('../../utils/log').child ({ module : 'lib/serviceClient'});

const serviceClient    = {};

/*
Schema for serviceConfig

name      -> type : String, MANDATORY, description : Name/Type of the service, ex : 'user'
id        -> type : String, MANDATORY, description : unique id of the service, ex : 'a4f195ee-aacd-4d8a-93c6-9f54d3c86b68'
namespace -> type : String, OPTIONAL, description  : Use as a prefix for default nats channels, default : '', ex : "namespace"
proto     -> type : String, OPTIONAL, description  : Protocol of the service (https, ws), default : 'http', ex : "https"
host      -> type : String, OPTIONAL, description  : Hostname where the service is running, default : 'localhost', ex : "user.service.com"
port      -> type : String, OPTIONAL, description  : Port where the service is running, default : null, ex : "3000"
custom    -> type : ANY,    OPTIONAL, description  : Any type of custom data that service wants to send (This data will be transparently forwared to App), default : {}, ex : {cpuLoad : "80"}
//TODO -> Ability to have custom as a function also, so that it can dynamically denerate values like cpuLoad etc. A user mmight want that
*/

/*
 * Initialise Connection to NATS
 * Init/start Service manager */
serviceClient.init = async function (serviceConfig, natsConfig) {
	return new Promise (async function (resolve, reject) {
		try {
			/*
			 * TODO
			 * validate serviceConfig */
			await natsIface.init (natsConfig);
			await serviceAnnouncer.init (serviceConfig);
		}
		catch (err) {
			log.error ({err : err}, 'serviceClient init error');
			reject (err);
			return;
		}
		resolve ();
	});
};

/*
 * Stop service manager */
serviceClient.deinit = function () {
	return new Promise (async function (resolve, reject) {
		try {
			await serviceAnnouncer.deinit ();
		}
		catch (err) {
			log.error ({err : err}, 'serviceClient deinit error');
			reject (err);
			return;
		}
		resolve ();
	});
};

module.exports = serviceClient;
