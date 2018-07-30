var Error_3A = require ('../../../../common/3a-error');
var service  = require ('../service/api');
var url      = require ('url');

var api = {};

function makeQuery (scope) {
	if (!scope)
		return '';

	return new url.URLSearchParams ({
		scope : JSON.stringify (scope)
	})
}

/* Service check */
api.ping = () => {
	return service.get ('user', '/ping');
};

api.get_version = () => {
	return service.get ('user', '/common/revision');
};

/* Profile */
api.get_profile = (id) => {
	return service.get ('user', `/profile/${id}`);
};

api.get_bulk_profiles = (id_list) => {
	return service.post ('user', `/profile/bulk`, {
		ids : id_list
	});
};

api.get_custom = (id, app, key) => {
	return service.post ('user', `/profile/custom/${id}/${app}`, {
		key : key
	});
};

api.get_bulk_custom = (id_list, app, keys) => {
	return service.post ('user', `/profile/bulk_custom/${app}`, {
		key : keys,
		ids : id_list
	});
};

api.get_all = (scope) => {
	return service.get ('user', `/profile/query/all?${makeQuery(scope)}`);
};

/* Password */
api.match_password = (id, password) => {
	return service.post ('user', '/password/match', {
		id       : id,
		password : password
	});
};

api.match_password_by_email = (email, password) => {
	return service.post ('user', '/password/match-email', {
		email    : email,
		password : password
	});
};

api.set_password = (id, password) => {
	return service.post ('user', '/password/create', {
		id       : id,
		password : password
	});
};

api.update_password = (id, old_pass, new_pass) => {
	return service.post ('user', '/password/update', {
		id          : id,
		oldPassword : old_pass,
		newPassword : new_pass
	});
};

api.reset_password = (id, new_pass, scope) => {
	return service.post ('user', `/password/reset/${id}?` + makeQuery(scope), {
		password  : new_pass
	});
};

/* Admin */
api.add = (data, scope) => {
	return service.post ('user', '/admin/add?' + makeQuery(scope), data);
};

api.edit = (id, data, scope) => {
	return service.post ('user', `/admin/edit/${id}?` + makeQuery(scope), data);
};

api.set_custom = (id, app, data) => {
	return service.post ('user', `/admin/custom/${id}/${app}`, data);
};

/* Roles */
api.add_role = (data) => {
	return service.post ('user', '/role/create', data);
};

api.edit_role = (id, data) => {
	return service.post ('user', '/role/edit/' + id, data);
};

api.get_role_profile = (id) => {
	return service.get ('user', `/role/profile/${id}`);
};

api.get_all_roles = (scope) => {
	return service.get ('user', '/role/profiles?' + makeQuery(scope));
};

module.exports = api;
