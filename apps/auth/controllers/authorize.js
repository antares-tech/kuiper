var uuid               = require('uuid');
var oauth2orize        = require('oauth2orize');
var AuthorizationError = oauth2orize.AuthorizationError;
var log                = require('common/log').child({ module:'controllers/authorize' });
var server             = require('apps/auth/common/server');
var cache              = require('apps/auth/common/cache').init('authcode', 10*60); /* 10 minutes */
var model              = require('apps/auth/models/clients');

var controller = {};

server.register_grant_code (function (client, redirect_uri, user, ares, areq, done) {
	/* issue grant callback */
	if (!client || !redirect_uri)
		return done (null, false);

	var uid = uuid();

	log.debug ({ client : client, user : user }, 'in register_grant_code');

	var info = JSON.stringify ({
		client_id      : client.id,
		user_id        : user.id,
		firstName      : user.firstName,
		lastName       : user.lastName,
		email          : user.email,
		detail         : user,
		redirect_uri   : redirect_uri,
		trusted_client : client.trusted,
	});

	log.debug ({ client_id : client.id, user_id : user.id, redirect_uri }, 'generated and saved authorization code for client');

	cache.set(uid, info);
	done(null, uid);
});

function validate (client_id, redirect_uri, done) {

	if (!client_id)
		return done (null, false);

	if (!redirect_uri)
		return done (null, false);

	model.get ('cid', client_id, function (err, f_client) {
		if (err) {
			var __error = new Error (err);
			log.error ({ err:err, stack:__error.stack }, 'db fetch error');
			return done (err);
		}

		if (!f_client) {
			log.error ({ client_id }, 'unregistered client id');
			return done (null, false);
		}

		if (f_client.cid !== client_id) {
			log.error ({ client_id }, 'client id mismatch');
			return done (null, false);
		}

		if (f_client.callback_url.indexOf (redirect_uri) < 0) {
			log.error ({ given : redirect_uri, as_per_records : f_client.callback_url }, 'redirect url mismatch');
			return done (null, false);
		}

		/* client validation OK */
		return done (null, {
			id           : f_client.cid, 
			redirect_uri : redirect_uri,
			trusted      : f_client.trusted,
		}, redirect_uri);
	});
}


controller.authorize = server.authorize (validate);

controller.decision  = server.decision ();

controller.errorhandler = server.errorHandler ('indirect');

module.exports = controller;
