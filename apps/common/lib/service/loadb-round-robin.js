var promise       = require ('bluebird');
var Error_3A      = require ('../../../../common/3a-error');
var beacon        = require ('./beacon');
var log           = require ('../../../../common/log').child ({ module : 'loadbalancer-rr'});

var loadb = {};

var begin_with_index = 0;

loadb.get_instances = (s_name) => {
	var instances = beacon.get_instances_cached (s_name);

	/*
	 * update begin_with_index */
	begin_with_index ++;
	begin_with_index = begin_with_index % instances.length;
	if (instances.length === 0)
		begin_with_index = -1;

	return {
		arr : instances,
		index : begin_with_index
	};
};

loadb.instance_info = (instance, err) => {
	return beacon.instance_info (instance, err);
};

module.exports = loadb;
