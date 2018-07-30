var passport            = require('passport');
var GoogleTokenStrategy = require('passport-google-id-token');
var url                 = require('url');
var log                 = require('common/log').child({ module:'controllers/mobile-auth/google' });
var user                = require('apps/common/lib/user/api');

var controller = {};

controller.web_clients = {
	nimble : 'some-client-id'
};

controller.__authenticate_google_id_token__ = function (req, res, next) {
	log.debug ({ req : req.query }, 'request query');

	return __authenticate__ (req, res, next);
};

passport.use (new GoogleTokenStrategy ({
	clientID : controller.web_clients.nimble,
	passReqToCallback : true
}, 
	async function verify (req, parsed_token, google_id, done) {
		log.trace ({ parsed_token }, 'token parsing successful');

		var idToken = (req.body && (req.body.id_token || req.body.access_token)) ||
			(req.query && (req.query.id_token || req.query.access_token)) ||
			(req.headers && (req.headers.id_token || req.headers.access_token));

		if (!parsed_token) {
			log.error ({ parsed_token }, 'Unable to decode id token, wrong request');
			return done (null, false, {message : 'Auth Failed!'});
		}

		if (!google_id) {
			log.error ({ idToken }, 'No sub claim parsed in idToken');
			return done (null, false, {message : 'Auth Failed!'});
		}

		var iss = parsed_token.iss;
		var exp = parsed_token.exp;
		var sub = google_id;
		var aud = parsed_token.sub;
		var azp = parsed_token.azp;

		if (expired(parsed_token)) {
			log.error ({ user_sub : parsed_token.payload.sub, email : parsed_token.payload.email }, 'Token Expired');
			return done (null, false, {message : 'Auth Failed!'});
		}

		/* check user exists in our system 
		var __user_info;
		try {
			log.info ('checking user existence in the system');
			__user_info = await user.get_profile (`${google_id}:google`);
			return done (null, {
				id    : google_id,
				d     : new Date().toISOString()
			});
		}
		catch (err) {
			log.warn ({err :err}, 'Auth Failed!');
			return done (err, null);
		}*/
		return done (null, {
			id    : `${google_id}:google`,
			d     : new Date().toISOString()
		});
	}));

function __authenticate__(req, res, next) {
	return passport.authenticate('google-id-token') (req, res, next);
}

function expired (parsed_token) {
	var expires_in = parsed_token.exp;
	if (Date.now() > expires_in)
		return true;
	return false;
}

module.exports = controller;
