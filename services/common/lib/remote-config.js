var promise = require('bluebird');
var consul  = require('consul');
var kv      = require ('common/store');

var config = {};

config.get = function () {
	/*
	 * Get config for this service from consul
	 * Store that config in local KV storage
	 */

	var p = promise.pending ();

	/* I should be able to find out config key from somewhere */
	var key = get_config_key ();

	consul.kv.get (key, function (err, data) {
		if (err) {
			/* should i print error also or just return it - discuss error handling */
			console.error ({err : err}, 'error getting service config');
			p.reject (err);
		} 
		console.log ({data : data}, 'service config get ok');
		if (!set_local_kv (key, data))
			p.reject (new Error ('local KV set error'));
		p.resolve(); /* discuss if resolve should get any param */
	});

	return p.promise;
};


function get_config_key () {
	/*
	 * This function will most probable will get key via some seervie handle which have all the service info */
	var key = 'config.user.master_config';


	return key;
}

function set_local_kv (key, data) {
	var options = get_options ();
	return kv.set (key, data, options);
}

function get_options () {
	return {
		replace : true
	};
}
