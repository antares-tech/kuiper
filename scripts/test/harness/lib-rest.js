var promise = require ('bluebird');
var restler = require ('restler');

var rest = {};

rest.get = (url, options) => {
	var _d = promise.pending ();

	var r = restler.get (url, options);

	r.on ('success', function (data, response) {
		_d.resolve (data);
	});
	r.on ('fail', function (data, response) {
		_d.reject (data);
	});
	r.on ('error', function (err, response) {
		_d.reject (err);
	});
	r.on ('timeout', function (ms) {
		_d.reject ('timeout');
	});

	return _d.promise;
};

rest.putJson = (url, data, options) => {
	return new Promise ((resolve, reject) => {
		var r = restler.putJson (url, data, options);

		r.on ('success', function (data, response) {
			return resolve (data);
		});
		r.on ('fail', function (data, response) {
			return reject (data);
		});
		r.on ('error', function (err, response) {
			return reject (err);
		});
		r.on ('timeout', function (ms) {
			return reject ('timeout');
		});
	});
};

rest.postJson = (url, data, options) => {
	return new Promise ((resolve, reject) => {
		var r = restler.postJson (url, data, options);

		r.on ('success', function (data, response) {
			return resolve (data);
		});
		r.on ('fail', function (data, response) {
			return reject (data);
		});
		r.on ('error', function (err, response) {
			return reject (err);
		});
		r.on ('timeout', function (ms) {
			return reject ('timeout');
		});
	});
};

module.exports = rest;
