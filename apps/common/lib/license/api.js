var Error_3A = require ('../../../../common/3a-error');
var service  = require ('../service/api');
var url      = require ('url');

var api = {};

/* Service check */
api.ping = () => {
	return service.get ('license', '/ping');
};

api.get_version = () => {
	return service.get ('license', '/common/revision');
};

/*
 * Actual service methods
 */

api.list = () => {
	return service.get ('license', '/template/list');
};

api.add = (data) => {
	return service.post ('license', '/template/add', data);
};

api.get = (_id) => {
	return service.get('license', `/template/get/${_id}`);
};

api.get_instance = (_id) => {
	return service.get('license', `/instance/get/${_id}`);
};

api.get_active_instance = (id, options) => {
	var expr  = options ? { options } : null;
	var query = '';

	if (expr)
		query = new url.URLSearchParams(expr || {});

	return service.get('license', `/instance/get/active/${id}?${query.toString()}`);
};

api.list_instances = () => {
	return service.get ('license', '/instance/list');
};

api.add_instance = (data) => {
	return service.post ('license', '/instance/add', data);
};

api.activate_instance = (data) => {
	return service.put ('license', '/instance/activate', data);
};

api.invalidate_instance = (data) => {
	return service.put ('license', '/instance/invalidate', data);
};

module.exports = api;
