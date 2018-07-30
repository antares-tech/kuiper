var passport            = require('passport');
var FbTokenStrategy = require('passport-facebook-token');
var url                 = require('url');
var log                 = require('common/log').child({ module:'controllers/mobile-auth/social/facebook' });
var user                = require('apps/common/lib/user/api');

var controller = {};

controller.web_clients = {
	nimble_client_id : 'some-client-id',
	nimble_client_secret : 'some-client-secret',
};

controller.__authenticate_facebook_id_token__ = function (req, res, next) {
	log.debug ({ req : req.query }, 'request query');

	return __authenticate__ (req, res, next);
};

passport.use (new FbTokenStrategy ({
	clientID : controller.web_clients.nimble_client_id,
	clientSecret : controller.web_clients.nimble_client_secret,
	accessTokenField : 'id_token',
}, 
	function (access_token, refresh_token, profile, done) {
		if (!profile)
			return done (null, false);

		//check id and add [:facebook] to the user authenticated at your server
	
		return done (null, {
			id : `${profile.id}:facebook`,
			d : new Date().toISOString(),
		});
	}));

function __authenticate__(req, res, next) {
	return passport.authenticate('facebook-token') (req, res, next);
}

function expired (parsed_token) {
	var expires_in = parsed_token.exp;
	if (Date.now() > expires_in)
		return true;
	return false;
}

module.exports = controller;
