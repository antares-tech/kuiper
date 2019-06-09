var h_nats    = require ('nats');
var log       = require ('../utils/log').child({ module : 'lib/nats' });

var m = {};
var nats = null;

m.connect = function (options) {
	return new Promise (function (resolve, reject) {
		/*
		 * Connect to Nats */
		nats = h_nats.connect (options);

		nats.on('error', function(err) {
			log.error ({ err : err}, 'connection failed');
			return reject (err);
		});

		nats.on('connect', function() {
			log.trace ('connection ok');
			return resolve ();
		});

		nats.on('disconnect', function() {
			log.warn ('disconnected');
		});

		nats.on('reconnecting', function() {
			log.trace ('reconnecting');
		});

		nats.on('reconnect', function() {
			log.warn('reconnect');
		});

		nats.on('close', function() {
			log.info('closed');
		});
	});
};

m.disconnect = function (/* options */) {
	return new Promise (function (resolve/*, reject*/) {
		if (nats) {
			nats.close ();
			nats = null;
		}
		resolve ();
	});
};

m.requestOne = function (channel, msg, options, timeout) {
	return new Promise (function (resolve, reject) {

		nats.requestOne.call (nats, channel, msg, options, timeout, function(response) {
			if (response.code && response.code === h_nats.REQ_TIMEOUT) {
				reject (response);
			}
			else {
				resolve (response);
			}
		});
	});
};

m.subscribe = function () {
	nats.subscribe.apply (nats, arguments);
};

m.unsubscribe = function () {
	nats.unsubscribe.apply (nats, arguments);
};

m.publish = function () {
	nats.publish.apply (nats, arguments);
};

module.exports = m;
