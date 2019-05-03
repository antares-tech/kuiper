var promise   = require ('bluebird');
var Error_3A  = require ('../../../../common/3a-error');
var rest      = require ('./rest');
var log       = require ('../../../../common/log').child ({ module : 'apps/common/lib/service/transport'});

var transport = {};

transport.send = function (s_endpoint, http_method, path, data, options) {
	var _p = promise.pending ();
	var _promise_rest;

	if (!s_endpoint || !s_endpoint.host || !s_endpoint.port) {
		let err = new Error_3A ('ERR_BAD_ARGUMENTS', 500, 'transport.send : service endpoint null or bad');
		_p.reject (err);
		return _p.promise;
	}

	switch (http_method.toLowerCase()) {
		case 'get':
			_promise_rest = rest.get (`http://${s_endpoint.host}:${s_endpoint.port}${path}`, options);
			break;

		case 'put':
			_promise_rest = rest.putJson (`http://${s_endpoint.host}:${s_endpoint.port}${path}`, data, options);
			break;

		case 'post':
			_promise_rest = rest.postJson (`http://${s_endpoint.host}:${s_endpoint.port}${path}`, data, options);
			break;

		default :
			let err = new Error_3A (`ERR_UNKNOWN_METHOD', 405, 'transport.send : unsupported http_method ${http_method}`);
			_p.reject (err);
			return _p.promise;
	}

	return _promise_rest;
};

module.exports = transport;
