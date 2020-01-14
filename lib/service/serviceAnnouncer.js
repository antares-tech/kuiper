const natsiface    = require ('../nats-iface');
const log          = require ('../../utils/log').child ({ module : 'lib/serviceAnnouncer' });
const config       = require ('../../common/config');

const serviceAnnouncer = {};

let __config = config.defaults.service;
let announcerDaemon;
let subscriptionId = null;

serviceAnnouncer.init = function (serviceConfig) {
	return new Promise (function (resolve/*, reject*/) {
		__config = {
			...__config,
			...serviceConfig
		};

		/*
		 * Add namesapce to channel names in case it is sent from upstream */
		addNamespace ();

		/*
		 * Stuff happening below :
		 * 	- Register a listner in case an APP is demanding attendence from all services
		 * 	- Send an announcement as soon as we are up
		 * 	- Annouce presense every 'configured' seconds */
		subscriptionId = natsiface.open_channel (config.channels.pull, parse_msg);
		serviceAnnouncer.send('active');
		announcerDaemon = setInterval (() => {serviceAnnouncer.send('active');}, __config.beaconInterval);

		/*
		 * Not sure of any reject scenarios yet
		 * will add as and when discovered */

		resolve ();
	});
};

/*
 * Parse messages sent over channels we are subscribed to */
function parse_msg (err, channel, __msg/*, replyTo*/) {
	if (err)
		return log.error ({err : err, channel : channel, msg : __msg}, 'error parsing message');

	let  msg = __msg;

	switch (msg.header['msg-name']) {
		case 'service-demand' :
			serviceAnnouncer.send ('active');
			break;

		default :
			log.error ({msg : msg}, 'unrecognised msg name. ignored');
			break;
	}
}

/*
 * Send current state of service over NATS */
serviceAnnouncer.send = function (state, callback) {
	natsiface.send (config.channels.discovery, new srv_msg (state), callback);
};

serviceAnnouncer.service_demand = function (__payload) {
	let i_am = __config.name;

	/*
	 * If key not present, assume requesting all services */
	if (!__payload.which_srv)
		return 	serviceAnnouncer.send ('active');

	try {
		/*
		 * We expect this to be an array */
		for (let i = 0 ; i < __payload.which_srv.length ; i++) {
			if (__payload.which_srv[i] === i_am)
				return serviceAnnouncer.send('active');
		}
	}
	catch (err) {
		log.error ({err : err}, 'error parsing payload, expected array for "which_srv"');
	}
};

/*
 * Undo everything done in init function and annouce non-availability of service */
serviceAnnouncer.deinit = function () {
	return new Promise (function (resolve/*, reject*/) {
		clearInterval (announcerDaemon);
		serviceAnnouncer.send('down', function () {
			if (subscriptionId) {
				natsiface.closeChannel (subscriptionId);
				subscriptionId = null;
			}

			resolve ();
		});
	});
};

/*********************
 * INTERNAL FUNCTIONs
 * *******************/

function addNamespace () {
	if (!__config.namespace)
		return;

	config.channels.discovery = `${__config.namespace}.${config.channels.discovery}`;
	config.channels.pull      = `${__config.namespace}.${config.channels.pull}`;
}

function srv_msg (state) {
	this.header={
		'msg-name' : 'service-announcement',
		'timestamp': new Date().toISOString(),
		'from'     : 'srv/' + __config.name

	};
	this.payload={
		'id'    : __config.id,
		'name'  : __config.name,
		'proto' : __config.proto || 'http',
		'host'  : __config.host || 'localhost',
		'port'  : __config.port,
		'state' : state,
		'custom': __config.custom || {}
	};
}

module.exports = serviceAnnouncer;
