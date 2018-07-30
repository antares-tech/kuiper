var moment     = require('moment');
var assert     = require('assert');
var Error_3A   = require('common/3a-error');
var log        = require('common/log').child({ module : 'controllers/admin' });
var model      = require("../models/admin");

var controller= {};

function error (err, code = 500) {
    if (err instanceof Error_3A)
        return err;

    var message = (typeof err === 'string' ? err : JSON.stringify (err));
    var E = new Error_3A ('SERVER_ERR', code, message);
    return E.serialize ();
}

controller.add = async function (req, res, next) {
	var data     = req.body,
		id       = data.id;

	log.trace ({ data }, 'request body');

	try {
		assert (id,              'id is missing');
		assert (data.firstName,  'first name is missing');
		assert (data.lastName,   'last name is missing');
		assert (data.createdBy,  '"created by" is missing');

		var result = await model.add (data);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err : err, stack : err.stack }, 'at add ()');
		return res.status (500).send (error (err));
	}
};

controller.edit = async function (req, res, next) {
	var data     = req.body,
		id       = req.params.id;

	try {
		assert (id,  'id is missing');
		assert (data,'data is missing');

		var result = await model.edit (id, data);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err : err, err : err.stack }, 'at edit ()');
		return res.status (500).send (error (err));
	}
};

controller.custom = async function (req, res, next) {
	var data     = req.body,
		params   = req.params,
		id       = params.id,
		app_name = params.app,
		key      = data.key,
		value    = data.value;

	log.trace ({ data }, 'request body');
	log.trace ({ params }, 'request params');

	try {
		assert (id,         'id is missing');
		assert (app_name,   'app name is missing');
		assert (key,        'key is missing');
		assert (value,      'value is missing');

		id = id.toLowerCase();
		var result = await model.custom (id, app_name, key, value);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err : err, stack : err.stack }, 'at custom ()');
		return res.status (500).send (error (err));
	}
};

/*
controller.update_profile = async (req, res, next) => {
	var data  = req.body,
		id    = req.params.id.toLowerCase(),
		find  = { id : id };

	try {
		assert (id,                  'Error: id is null');
		assert (data,           'Error: profile data is null');
		assert (!data.password_info, 'Error: password data added in profile data');
		assert (!data.id,            'Error: id added in profile data');
		assert (!data.auth_via,      'Error: auth_via added in profile data');

		data.modified_on = moment().toISOString();

		var result = await model.update_profile (find, data);

		return res.send (result);
	}
	catch (err) {
		log.error ({ err : err }, 'Error at update_profile ()');
		var E = new Err ('SERVER_ERR', 500, 'Profile not updated: ' + err);
		return res.status (500).send (E.serialize ());
	}
};
*/

module.exports = controller;
