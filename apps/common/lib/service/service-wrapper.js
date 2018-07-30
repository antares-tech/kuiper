var promise       = require ('bluebird');
var Error_3A      = require ('../../../../common/3a-error');
var load_balancer = require ('./load-balancer');
var transport     = require ('./transport');
var log           = require ('../../../../common/log').child ({ module : 'apps/common/lib/service/service-wrapper'});

var serv = {};

serv.send = async function (http_method, s_name, path, data, options) {
	var p = promise.pending ();

	let __srv_info  = load_balancer.get_instances (s_name);
	let instances   = __srv_info.arr;
	let start_index = __srv_info.index;

	if (start_index < 0 || instances.length === 0) {
		log.error ({srv_info : __srv_info, service_name : s_name}, 'no available instances for this service. error calling api');
		p.reject (new Error_3A ('ENOSRV', 500, `no service instance available for ${s_name}`));
		return p.promise;
	}

	log.trace ({srv_info : __srv_info}, 'usable instances returned by loadbalancer');

	var result;
	let arr_length = instances.length;
	for (let index = start_index ; index < arr_length + start_index ; index++) {
		let i = index % arr_length;
		try {
			result = await transport.send (instances[i], http_method, path, data, options);
		} catch (e) {
			/*
			 * This error will also decide wether to remove instance or just increase the failure count */
			load_balancer.instance_info (instances[i], e);

			if (i === arr_length - 1){
				p.reject(e);
				break;
			}
			continue;
		}

		/*
		 * Mark the service as active if it was in any other state */
		if (instances[i].state !== 'active')
			load_balancer.instance_info (instances[i]);

		p.resolve (result);
		break;
	}

	return p.promise;
};

module.exports = serv;
