var assert   = require ('assert'); 
var model    = require ('../models/profile');
var log      = require ('common/log').child({ module : 'controllers/profile' });
var Error_3A = require ('common/3a-error');

var controller = {};

function error (err, code = 500) {
	if (!err) {
		log.error ({ stack : (new Error ()).stack }, 'undefined error');
		return (new Error_3A ('ERR_WTF', 500, 'coding error')).serialize ();
	}

	if (err instanceof Error_3A)
		return err;

	var message = (typeof err === 'string' ? err : JSON.stringify (err));
	var E = new Error_3A ('SERVER_ERR', code, message);
	return E.serialize ();
}

controller.profile = async function (req, res, next) {
	var params   = req.params,
		id       = params.id;

	log.trace ({ params }, 'request params');

	try {
		assert (id, 'id is missing');

		id = id.toLowerCase();
		var result = await model.info_id (id);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err }, 'at info_id ()');
		return res.status (500).send (error (err));
	}
};

controller.bulk_profiles = async function (req, res, next) {
	var body = req.body,
		ids  = body.ids;

	log.trace ({ body }, 'request body');

	try {
		assert (ids, 'ids are missing');

		var result = await model.bulk (ids);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err }, 'at bulk_profiles ()');
		return res.status (500).send (error (err));
	}
};

controller.custom = async function (req, res, next) {
	var params   = req.params,
		body     = req.body,
		id       = params.id,
		app_name = params.app,
		key      = body.key || null;

	log.trace ({ params }, 'request params');
	log.trace ({ body }, 'request body');

	try {
		assert (id,       'id is missing');
		assert (app_name, 'app name is missing');

		id = id.toLowerCase();
		var result = await model.custom (id, app_name, key);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err }, 'at custom ()');
		return res.status (500).send (error (err));
	}
};

controller.bulk_custom = async function (req, res, next) {
	var params   = req.params,
		body     = req.body,
		ids      = body.ids,
		app_name = params.app,
		key      = body.key || null;

	log.trace ({ params }, 'request params');
	log.trace ({ body }, 'request body');

	try {
		assert (ids,      'ids are missing');
		assert (app_name, 'app name is missing');

		var result = await model.bulk_custom (ids, app_name, key);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err }, 'at bulk_custom ()');
		return res.status (500).send (error (err));
	}
};

controller.all = async function (req, res, next) {
	var params   = req.params;
	var query    = req.query;
	var scope    = null;

	log.trace ({ params }, 'request params');
	
	try {
		if (query && query.scope)
			scope = JSON.parse(query.scope);

		var result = await model.all (scope);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err:err, stack:err.stack }, 'error at all ()');
		return res.status (500).send (error (err));
	}
};

module.exports = controller;
