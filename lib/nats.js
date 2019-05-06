var h_nats    = require ('nats');
var log       = require ('./log').child({ module : 'lib/nats' });

var m = {};
var nats = null;

m.connect = function (options) {
	return new Promise (async function (resolve, reject) {
		/*
		 * Connect to Nats */
		nats = h_nats.connect (options);

		nats.on('error', function(err) {
			log.error ({ err : err}, 'connection failed');
			return reject (err);
		});

		nats.on('connect', function(nc) {
			log.trace ('connection ok');
			return resolve ();
		});

		nats.on('disconnect', function() {
			log.warn ('disconnected');
		});

		nats.on('reconnecting', function() {
			log.trace ('reconnecting');
		});

		nats.on('reconnect', function(nc) {
			log.warn('reconnect');
		});

		nats.on('close', function() {
			log.info('closed');
		});
	});
};

m.requestOne = function (channel, msg, options, timeout) {
	return new Promise (async function (resolve, reject) {

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

m.publish = function () {
	nats.publish.apply (nats, arguments);
};

module.exports = m;
