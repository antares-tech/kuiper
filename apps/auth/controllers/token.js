var oauth2orize            = require('oauth2orize');
var AuthorizationError     = oauth2orize.AuthorizationError;
var passport               = require('passport');
var ClientPasswordStrategy = require('passport-oauth2-client-password');
var log                    = require('common/log').child ({ module:'controllers/token' });
var server                 = require('apps/auth/common/server');
var model                  = require('apps/auth/models/clients');
var cache                  = require('apps/auth/common/cache').init('authcode');
var jwt                    = require('apps/auth/lib/token-verify/jwt');

var controller = {};

server.register_exchange_code (function (client, code, redirect_uri, done){

	var val = {};
	var key = code;
	var cid = client.id;

	cache.get (key, function (err, value) {

		if (err) {
			log.error ({err : err}, 'redis get error');
			return done(err, null);
		}

		try {
			json = JSON.parse(value);
			log.debug ({ key }, 'JSON parse successfull from redis authorization_code store');
		}
		catch (ex) {
			log.error ({ key, value }, 'JSON parse error from redis store authorization_code');
			return done (ex, null);
		}

		model.get ('cid', cid, function (err, _client) {

			if (err) {
				log.error ( {err : err}, 'unable to fetch client for client');
				return done(err, null);
			}

			if (!_client) {
				log.error ( { cid }, 'no record found for client_id : ');
				return done (null, false);
			}

			if (_client.cid !== json.client_id) {
				log.error ('Something\'s wrong! Unauthorized client!');
				return done (null, false);

			}
			if (_client.callback_url.indexOf (json.redirect_uri) < 0) {
				log.error ({ uri : json.redirect_uri, cb : _client.callback_url }, 'Something\'s wrong! callback url mismatches from previously granted client');
				return done (null, false);

			}
			/*
			 * everything seems fine now, specify the claims you want
			 * to issue to the client
			 */
			var display_name = `${json.firstName}${json.lastName ? " " + json.lastName : ""}`;
			var claims   = {
				sub    : json.user_id,
				name   : display_name,
				email  : json.email,
				detail : json.detail,
				aud    : json.client_id,
			};

			log.debug ( {subject : claims.sub, audience : claims.audience}, `generating json web token with claims`);
			jwt.generate (claims, function (err, token) {

				if (err) {
					log.error ({err : err}, 'error generating jwt');
					return done (err, null);
				}

				log.debug ({ cid : cid, token : token }, 'access token generated for client :');
				return done (null, token);
			});
		});
	});
});

/**
 * client password strategy middleware to be used for each
 * authorization request made by a client
 *
 */

passport.use ('client_password', new ClientPasswordStrategy (function (client_id , client_secret, done) {

	var cid    = client_id;
	var secret = client_secret;

	model.get('cid', cid, function (err, _client){
		if (err) {
			log.error ({err : err}, 'Error in fetching client : ' + client_id);
			done (err, null);
		}

		if (cid !== _client.cid) {
			log.error ( {clientID : _client.cid}, 'Passport authentication : client authentication failed');
			return done (null, false);
		}

		if (secret !== _client.secret) {
			log.error ('Passport authentication : client authentication failed. client_secret mismatch');
			return done (null, false);
		}

		log.debug ({client_id : _client.cid }, 'Passport authentication : client successfully authenticated');

		done (null, {
			id : cid,
			d  : new Date().toISOString(),
		});
	});


}));

/**
 * token middleware which handles requests coming for
 * access tokens in return or exchange of authorization grant given
 * by users
 */
controller.token = server.token ();

/**
 * error handler middlewareve 
 */

controller.errorhandler = server.errorHandler ();

/**
 * client password passport authenticate middleware
 */

controller.__authenticate_client__ = passport.authenticate ('client_password');


module.exports = controller;
