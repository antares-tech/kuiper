var h_nats    = require ('nats');
var promise   = require ('bluebird');
var log       = require ('./log').child({ module : 'lib/nats' });

var m = {};
var nats = null;

m.connect = function (options) {
	var _d = promise.pending();

	/*
	 * Connect to Nats */
	nats = h_nats.connect (options);

	nats.on('error', function(err) {
		log.error ({ err : err}, 'connection failed');
		return _d.reject (err);
	});

	nats.on('connect', function(nc) {
		log.trace ('connection ok');
		return _d.resolve ();
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

	return _d.promise;
};

m.requestOne = function (channel, msg, options, timeout) {
	var _p = promise.pending ();

	nats.requestOne.call (nats, channel, msg, options, timeout, function(response) {
		if (response.code && response.code === h_nats.REQ_TIMEOUT) {
			_p.reject (response);
		}
		else {
			_p.resolve (response);
		}
	});

	return _p.promise;
};

m.subscribe = function () {
	nats.subscribe.apply (nats, arguments);
};

m.publish = function () {
	nats.publish.apply (nats, arguments);
};

module.exports = m;
