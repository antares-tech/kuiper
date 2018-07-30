var restler = require ('restler');
var colors  = require ('colors');

var rest = {};

rest.get = (url, options) => {
	return new Promise ((resolve, reject) => {
		var r = restler.get (url, options);

		r.on ('success', function (data, response) {
			return resolve (data);
		});
		r.on ('fail', function (data, response) {
			console.error (colors.red ('rest.get failed : http-code : ' + response.statusCode));
			return reject (data);
		});
		r.on ('error', function (err, response) {
			console.error (colors.red (`rest.get error : ${err}`));
			return reject (err);
		});
		r.on ('timeout', function (ms) {
			return reject ('timeout');
		});
	});
};

rest.putJson = (url, data, options) => {
	return new Promise ((resolve, reject) => {
		var r = restler.putJson (url, data, options);

		r.on ('success', function (data, response) {
			return resolve (data);
		});
		r.on ('fail', function (data, response) {
			console.error (colors.red ('http-code : ' + response.statusCode));
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
			console.error (colors.red ('http-code : ' + response.statusCode));
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
