var Error_3A = require ('../../../../common/3a-error');
var service  = require ('../service/api');
var url      = require ('url');

var api = {};

/* Service check */
api.ping = () => {
	return service.get ('org', '/ping');
};

api.get_version = () => {
	return service.get ('org', '/common/revision');
};

/*
 * Actual service methods
 */

api.list = (scope) => {
	var expr  = scope ? { scope : JSON.stringify(scope) } : null;
	var query = '';

	if (expr)
		query = new url.URLSearchParams(expr || {});

	return service.get ('org', '/org/list?' + query);
};

api.get = (id) => {
	return service.get ('org', `/org/get/${id}`);
};

api.add = (data) => {
	return service.post ('org', `/org/add`, data);
};

module.exports = api;
