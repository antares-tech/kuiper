var promise       = require ('bluebird');
var restler       = require ('restler');
var Error_3A      = require ('../../../../common/3a-error');
var log           = require ('../../../../common/log').child ({ module : 'apps/common/lib/service/rest'});

var rest = {};

rest.get = (url, options) => {
	var p = promise.pending ();
	var r = restler.get (url, options);

	r.on ('success', function (data, response) {
		p.resolve (data);
	});

	r.on ('error', function (err, response) {

		var code = err.code || 'ERR_UNKNOWN';

		var e = new Error_3A (code, 500, `error for ${url}: ${code}`);
		p.reject (e);
	});

	r.on ('fail', function (data, response) {
		var status_code = response.statusCode || 500;
		var message     = data.message || response.statusMessage;
		var key         = data.name || 'ERR_WTF';

		var e = new Error_3A (key, status_code, message);
		p.reject (e);
	});

	r.on ('timeout', function (ms) {
		var e = new Error_3A ('ETIMEDOUT', 500, `connection timedout for ${url}`);
		p.reject (e);
	});

	return p.promise;
};

rest.putJson = (url, data, options) => {
	var p = promise.pending ();
	var r = restler.putJson (url, data, options);

	r.on ('success', function (data, response) {
		p.resolve (data);
	});

	r.on ('error', function (err, response) {

		var code = err.code || 'ERR_UNKNOWN';

		var e = new Error_3A (code, 500, `error for ${url}: ${code}`);
		p.reject (e);
	});

	r.on ('fail', function (data, response) {
		var status_code = response.statusCode || 500;
		var message     = data.message || response.statusMessage;
		var key         = data.name || 'ERR_WTF';

		var e = new Error_3A (key, status_code, message);
		p.reject (e);
	});

	r.on ('timeout', function (ms) {
		var e = new Error_3A ('ETIMEDOUT', 500, `connection timedout for ${url}`);
		p.reject (e);
	});

	return p.promise;
};

rest.postJson = (url, data, options) => {
    var p = promise.pending ();
    var r = restler.postJson (url, data, options);

    r.on ('success', function (data, response) {
	        p.resolve (data);
	    });

	r.on ('error', function (err, response) {

		var code = err.code || 'ERR_UNKNOWN';

		var e = new Error_3A (code, 500, `error for ${url}: ${code}`);
		p.reject (e);
	});

	r.on ('fail', function (data, response) {
		var status_code = response.statusCode || 500;
		var message     = data.message || response.statusMessage;
		var key         = data.name || 'ERR_WTF';

		var e = new Error_3A (key, status_code, message);
		p.reject (e);
	});

	r.on ('timeout', function (ms) {
		var e = new Error_3A ('ETIMEDOUT', 500, `connection timedout for ${url}`);
		p.reject (e);
	});

    return p.promise;
};

module.exports = rest;
