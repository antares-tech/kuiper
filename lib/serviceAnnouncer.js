let moment       = require ('moment');
let log          = require ('./log').child ({ module : 'lib/serviceAnnouncer' });
let natsiface    = require ('./nats-iface');

var serviceAnnouncer = {};
var subject = {
	discovery : 'service.discovery',
	pull : 'service.pull'
};

/*
 * Get this from store
 * ideally configurable
 * hardcodind for dev */
var beacon_interval = 15 * 1000;
let conf = {};

serviceAnnouncer.init = function (config) {
	return new Promise (function (resolve, reject) {

		/*
		 * TODO
		 * needs proper config handling */
		conf = config;

		natsiface.open_channel (subject.pull, parse_msg);
		serviceAnnouncer.send('active');
		setInterval (() => {serviceAnnouncer.send('active');}, beacon_interval);

		/*
		 * Not sure of any reject scenarios yet
		 * will add as and when discovered */

		resolve ();
	});
};

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
serviceAnnouncer.send = function (state) {
	/*
	 * Create beacon payload
	 * send one beacon immidiatly
	 * create an interval for beacon*/
	natsiface.send (subject.discovery, new srv_msg (state));
};

serviceAnnouncer.service_demand = function (__payload) {
	let i_am = conf.name;

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

serviceAnnouncer.deinit = function () {
	/*
	 * send service unavailable request over nats */
	return new Promise (function (resolve, reject) {

		serviceAnnouncer.send('down');

		resolve ();
	});
};

function srv_msg (state) {
	this.header={
		'msg-name' : 'service-announcement',
		'timestamp': moment().toISOString(),
		'from'     : 'srv/' + conf.name

	};
	this.payload={
		'id'    : conf.id,
		'name'  : conf.name,
		'proto' : 'http',
		'host'  : conf.host || 'localhost',
		'port'  : conf.port,
		'state' : state
	};
}

module.exports = serviceAnnouncer;
