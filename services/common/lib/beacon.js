var moment       = require ('moment');
var promise      = require ('bluebird');
var log          = require ('common/log').child ({ module : 'beacon' });
var store        = require ('common/store');
var natsiface    = require ('common/nats-iface');
var sig_h        = require ('services/common/lib/signal-handlers');

var beacon = {};
var subject = {
	discovery : 'service.discovery',
	pull : 'service.pull'
};

/*
 * Get this from store
 * ideally configurable
 * hardcodind for dev */
var beacon_interval = 15 * 1000;

beacon.init = function () {
	var _d = promise.pending ();

	natsiface.open_channel (subject.pull, parse_msg);
	beacon.send('active');
	setInterval (() => {beacon.send('active');}, beacon_interval);

	/*
	 * Register deinit for graceful shutdown notification */
	sig_h.register_deinit_handler ('service shutdown', deinit);

	/*
	 * Not sure of any reject scenarios yet
	 * will add as and when discovered */

	_d.resolve ();
	return _d.promise;
};

function parse_msg (err, channel, __msg, replyTo) {

	if (err)
		return log.error ({err : err, channel : channel, msg : __msg}, 'error parsing message');

	let  msg = __msg;

	switch (msg.header['msg-name']) {
		case 'service-demand' :
			beacon.send ('active');
			break;

		default :
			log.error ({msg : msg}, 'unrecognised msg name. ignored');
			break;
	}
}
beacon.send = function (state) {
	/*
	 * Create beacon payload
	 * send one beacon immidiatly
	 * create an interval for beacon*/
	natsiface.send (subject.discovery, new srv_msg (state));
};

beacon.service_demand = function (__payload) {
	let i_am = store.get('name');

	/*
	 * If key not present, assume requesting all services */
	if (!__payload.which_srv)
		return 	beacon.send ('active');

	try {
		/*
		 * We expect this to be an array */
		for (let i = 0 ; i < __payload.which_srv.length ; i++) {
			if (__payload.which_srv[i] === i_am)
				return beacon.send('active');
		}
	}
	catch (err) {
		log.error ({err : err}, 'error parsing payload, expected array for "which_srv"');
	}
};

function deinit () {
	/*
	 * send service unavailable request over nats */
	var _d = promise.pending ();

	beacon.send('down');

	_d.resolve ();
	return _d.promise;
}

function srv_msg (state) {
	this.header={
		'msg-name' : 'service-announcement',
		'timestamp': moment().toISOString(),
		'from'     : 'srv/' + store.get ('name')

	};
	this.payload={
		'id'    : store.get ('id'),
		'name'  : store.get ('name'),
		'proto' : 'http',
		'host'  : store.get ('host') || 'localhost',
		'port'  : store.get ('port'),
		'state' : state
	};
}

module.exports = beacon;
