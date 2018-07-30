var colors  = require ('colors');
var promise = require ('bluebird');
var h_nats  = require ('nats');

var m = {};
var nats = null;

m.connect = function () {
    var _d = promise.pending();

    /*
     * Connect to Nats */
    nats = h_nats.connect ();

    nats.on('error', function(err) {
        console.log (colors.red ('connection failed') + ' : ' + err);
        return _d.reject (err);
    });

    nats.on('connect', function(nc) {
        console.log (colors.dim ('connection ok'));
        return _d.resolve ();
    });

    nats.on('disconnect', function() {
        console.log (colors.red ('disconnected'));
    });

    nats.on('reconnecting', function() {
        console.log ('reconnecting');
    });

    nats.on('reconnect', function(nc) {
        console.log ('reconnect');
    });

    nats.on('close', function() {
    });

    return _d.promise;
};

m.publish = function (subject, data) {
	var _d = promise.pending ();

	nats.publish (subject, data, function (err) {
		console.log (`published (sub=${subject})`)

		return _d.resolve ();
	});

	return _d.promise;
};

m.requestOne = function (subject, data, options, timeout) {
	var _d = promise.pending ();

	nats.requestOne (subject, data, options, timeout, function (response) {
		return _d.resolve (response);
	});

	return _d.promise;
};

module.exports = m;
