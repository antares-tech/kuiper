var promise   = require ('bluebird');
var natsiface = require ('common/nats-iface');
var beacon    = require ('./beacon');
var log       = require ('common/log').child({ module : 'services/common/lib/errand' });

var errand =  {};
var channel = 'service.pull';

errand.deliver = function () {
	var _d = promise.pending ();

	natsiface.open_channel (channel, parse_msg);
	log.debug (`nats channel open -> ${channel}`);

	_d.resolve ();
	return _d.promise;
};

function parse_msg (err, channel, __msg, replyTo) {

	if (err) 
		return log.error ({err: err, channel : channel, msg : __msg}, 'error parsing message');

	var msg = __msg;
	log.debug ({channel : channel, msg : msg}, 'nats message recieve');

	switch (msg.header['msg-name']) {
			/*
			 * Parse the type of message here
			 * Let respective modules handle the paylaod grammer */
		case 'service-demand' :
			beacon.service_demand (msg.payload);
			break;

		default :
			log.error ({msg : msg}, 'unrecognised msg name. ignored');
			break;
	}

}

module.exports = errand;
