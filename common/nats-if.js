var store    = require ('common/store');
var log      = require ('common/log').child({ module : 'nats-if' });
var promise  = require ('bluebird');
var nats     = require ('common/nats');
var protocol = require ('./protocol');

var m = {};

m.init = async function () {
	return nats.connect ();
};

m.open_channel = function (channel, callback) {
	var sid = nats.subscribe (channel, function (_msg_str, reply_to) {
		var msg;

		try {
			if (!_msg_str)
				throw 'null message string';

			let _msg = JSON.parse (_msg_str);
			msg  = new protocol (_msg);
		}
		catch (e) {
			log.error ({ _msg : _msg_str, error : e, stack: e.stack, channel : channel }, `message dropped`);
			return;
		}

		return callback (channel, msg, reply_to);
	});

	return sid;
};

m.reply = function (channel, msg) {
	nats.publish (channel, JSON.stringify (msg.toObject()));
};

m.send = m.reply;

m.request = async function (channel, msg, options, timeout) {
	var p = promise.pending ();
	var response;

	log.trace ({ ch : channel, msg_id : msg.id, to : msg.to.toString() }, 'sending request');

	try {
		var _res = await nats.requestOne (channel, msg.toString(), options, timeout);
		var _msg = JSON.parse (_res);
		response = new protocol (_msg);
		p.resolve (response);
	}
	catch (e) {
		log.error ({ _msg : msg.toObject (), response : _msg, error : e, stack: e.stack, channel : channel }, `error in response`);
		p.reject (e);
	}

	return p.promise;
};

module.exports = m;
