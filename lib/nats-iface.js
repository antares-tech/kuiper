var nats     = require ('./nats');

var __module = {};

__module.init = function  (natsConfig) {
	/* returns a promise to nats connection */
	return nats.connect (natsConfig);
};

__module.open_channel = function (channel, callback) {
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

__module.reply = function (channel, msg) {
	nats.publish (channel, JSON.stringify (msg));
};

__module.send = __module.reply;

__module.request = function (channel, msg, options, timeout) {
	/* NOT YET IMPLEMENTED */
};


module.exports = __module;
