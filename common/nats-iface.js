var promise  = require ('bluebird');
var nats     = require ('../common/nats');

var m = {};

m.init = function  (options) {
	/* returns a promise to nats connection */
	return nats.connect (options);
};

m.open_channel = function (channel, callback) {
	var sid = nats.subscribe (channel, function (_msg_str, reply_to) {
		var msg;

		try {
			if (!_msg_str)
				throw new Error ('null message string');
			msg = JSON.parse (_msg_str);
		}
		catch (e) {
			return callback (e, null, null, null);
		}

		return callback (null, channel, msg, reply_to);
	});

	return sid;
};

m.reply = function (channel, msg) {
	nats.publish (channel, JSON.stringify (msg));
};

m.send = m.reply;

m.request = function (channel, msg, options, timeout) {
	/* NOT YET IMPLEMENTED */
};


module.exports = m;
