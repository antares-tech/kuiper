var moment     = require('moment');
var assert     = require('assert');
var Error_3A   = require('common/3a-error');
var log        = require('common/log').child({ module : 'controllers/roles' });
var model      = require('../models/roles');

var roles= {};

function error (err, code = 500) {
    if (err instanceof Error_3A)
        return err;

    var message = (typeof err === 'string' ? err : JSON.stringify (err));
    var E = new Error_3A ('SERVER_ERR', code, message);
    return E.serialize ();
}

roles.create = async function (req, res, next) {
	var data     = req.body;

	log.trace ({ data }, 'request body');

	try {
		var result = await model.add (data);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error({ error : err, stack : err.stack }, 'Error in role create');
		return res.status (500).send (error (err));
	}
};

roles.edit = async function (req, res, next) {
	var id       = req.params.id;
	var data     = req.body;

	try {
		var result = await model.edit (id, data);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error({ error : err, stack : err.stack }, 'Error in role edit');
		return res.status (500).send (error (err));
	}
};

roles.get = async function (req, res, next) {
	var id = req.params.id;

	try {
		var result = await model.get (id);

		return res.status (200).send (result);
	}
	catch (err) {
		return res.status (500).send (error (err));
	}
};

roles.get_all = async function (req, res, next) {
	var data     = req.body;
	var query    = req.query;
	var scope    = null;

	try {
		if (query && query.scope)
			scope = JSON.parse(query.scope);

		log.debug ({ scope : scope }, 'scope for list roles');
		var result = await model.list (scope);

		return res.status (200).send (result);
	}
	catch (err) {
		return res.status (500).send (error (err));
	}
};

module.exports = roles;
