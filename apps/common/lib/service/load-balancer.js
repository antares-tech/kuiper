var Error_3A      = require ('../../../../common/3a-error');
var rr            = require ('./loadb-round-robin');
var log           = require ('../../../../common/log').child ({ module : 'apps/common/lib/service/load-balancer'});

var loadb = {};

loadb.get_instances = (s_name) => {
	return rr.get_instances (s_name);
};

loadb.instance_info = (instance, err) => {
	return rr.instance_info (instance, err);
};

module.exports = loadb;
