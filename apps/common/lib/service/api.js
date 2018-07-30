var promise   = require ('bluebird');
var Error_3A  = require ('../../../../common/3a-error');
var log       = require ('../../../../common/log').child ({ module : 'common/lib/service/api'});
var service   = require ('./service-wrapper.js');
var beacon    = require ('./beacon');

var api = {};

api.get = async (s_name, path, options) => {
	var p = promise.pending ();

	try {
		/*
		 * Re-try logic can be incorporated here */
		var result = await service.send ('GET', s_name, path, null /* data */, options);
		p.resolve (result);

	} catch (e) {
		if (e instanceof Error_3A) {
			p.reject (e);
			return p.promise;
		}

		var message = (typeof e === 'string' ? e : JSON.stringify (e));
		var err = new Error_3A ('ERR_WTF', 500, message);
		p.reject (err);
	}

	return p.promise;
};

api.post = async (s_name, path, data, options) => {
	var p = promise.pending ();

	try {
		/*
		 *          * Re-try logic can be incorporated here */
		var result = await service.send ('POST', s_name, path, data, options);
		p.resolve (result);

	} catch (e) {
		if (e instanceof Error_3A) {
			p.reject (e);
			return p.promise;
		}

		var message = (typeof e === 'string' ? e : JSON.stringify (e));
		var err = new Error_3A ('ERR_WTF', 500, message);
		p.reject (err);
	}

	return p.promise;
};

api.put = async (s_name, path, data, options) => {
	var p = promise.pending ();

	try {
		/*
		 *          * Re-try logic can be incorporated here */
		var result = await service.send ('PUT', s_name, path, data, options);
		p.resolve (result);

	} catch (e) {
		if (e instanceof Error_3A) {
			p.reject (e);
			return p.promise;
		}

		var message = (typeof e === 'string' ? e : JSON.stringify (e));
		var err = new Error_3A ('ERR_WTF', 500, message);
		p.reject (err);
	}

	return p.promise;
};


module.exports = api;
