var assert      = require ('assert'); 
var model       = require ('../models/password');
var log         = require ('common/log').child({ module : 'controllers/password' });
var Error_3A    = require ('common/3a-error');
var crypt       = require ('../lib/password-crypt');
var model_roles = require ('../models/roles');
var PermsClass  = require ('../lib/perms-class');

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

controller.password = async function (req, res, next) {
	var data     = req.body,
		password = data.password,
		id       = data.id;

	log.trace ({ data }, 'request body');

	try {
		assert (id,       'id is missing');
		assert (password, 'password is missing');

		var encrypt = await crypt.encrypt_password (password);
		log.debug ({ encrypt }, 'encrypted password');

		Object.assign(data, encrypt);
		var result = await model.set_password (data);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err }, 'at set_password ()');
		return res.status (500).send (error (err));
	}
};

controller.match_password = async function (req, res, next) {
	var body     = req.body,
		pass     = body.password,
		id       = body.id;

	log.trace ({ body }, 'request body');

	try {
		assert (id,   'id is missing');
		assert (pass, 'password is missing');
		
		id = id.toLowerCase();
		var password_db  = await model.get_password (id);
		var encrypt_pass = await crypt.encrypt_password (pass, password_db);

		if (encrypt_pass.password !== password_db.password) {
			var err = 'user name or password mismatch';
			return res.status (401).send (error (err, 401));
		}

		var _profile = await model.info_id (password_db.id);
		var profile  = _profile.toObject ();

		if (profile.roleId) {
			var roleInfo     = await model_roles.get (profile.roleId);

			if (roleInfo) {
				var Perms        = new PermsClass (roleInfo.toObject().perms);
				profile.role     = {
					name  : roleInfo.name,
					perms : Perms.resolveScopes (profile),
				};
			}
		}

		return res.status (200).send (profile);
	}
	catch (err) {
		log.error ({ err : err, stack : err.stack }, 'at match_password ()');
		return res.status (500).send (error (err));
	}
};

controller.match_password_email = async function (req, res, next) {
	var body     = req.body,
		pass     = body.password,
		email    = body.email;

	log.trace ({ body }, 'request body');
	
	try {
		assert (email, 'Error: email is null');
		assert (pass,  'Error: password is null');

		email = email.toLowerCase ();

		var users = await model.info_email (email);

		if (users.length > 1)
			throw 'Invalid User';
		
		var password_db  = await model.get_password (users[0].id);
		var encrypt_pass = await crypt.encrypt_password (pass, password_db);
	
		if (encrypt_pass.password !== password_db.password) {
			log.warn ({ encrypt_pass , password_db }, 'incorrect password');
			return res.status (401).send (error (err, 401));
		}

		var _profile = await model.info_id (password_db.id);
		var profile  = _profile.toObject ();

		if (profile.roleId) {
			profile.roleInfo = await model_roles.get (profile.roleId);
		}

		return res.status (200).send (profile);
	}
	catch (err) {
		log.error ({ err }, 'at match_password_email ()');
		return res.status (500).send (error (err));
	}
};

controller.update_password = async function (req, res, next) {
	var data     = req.body,
		id       = data.id,
		old_pass = data.oldPassword,
		new_pass = data.newPassword;

	log.trace ({ data }, 'request body');

	try {
		assert (id,       'id is missing');
		assert (old_pass, 'old password is missing');
		assert (new_pass, 'new password is missing');

		id = id.toLowerCase();
		var password_db  = await _model.get_password (id);
		log.debug ({ password_db }, 'password from db');

		var encrypt_pass = await crypt.encrypt_password (old_pass, password_db);
		log.debug ({ encrypt_pass }, 'encrypted password');

		if (encrypt_pass.password !== password_db.password)
			throw 'Old password is incorrect!';

		var encrypt = await crypt.encrypt_password (new_pass);
		log.debug ({ encrypt }, 'encrypted password');

		var result  = await model.update_password (id, encrypt);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err }, 'at update_password ()');
		return res.status (500).send (error (err));
	}
};

controller.reset_password = async function (req, res, next) {
	var data     = req.body,
		password = data.password,
		id       = req.params.id;

	try {
		assert (id,       'id is missing');
		assert (password, 'password is missing');

		var encrypt = await crypt.encrypt_password (password);
		log.debug ({ encrypt }, 'encrypted password');

		Object.assign(data, encrypt);
		var result = await model.reset_password (id, data);

		return res.status (200).send (result);
	}
	catch (err) {
		log.error ({ err : err, stack : err.stack, id : id }, 'at reset_password ()');
		return res.status (500).send (error (err));
	}
};

module.exports = controller;
