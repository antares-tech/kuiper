var express        = require('express');
var router         = express.Router();
var passport       = require ('passport');
var OAuth2Strategy = require ('passport-oauth2');
var log            = require('common/log');
var store          = require('common/store');
var network_info   = require('apps/common/network-info');

var name = store.get('name');
var type = store.get('type');

var my_network_ep, auth_network_ep, client_id, client_secret;

/*
 * TODO : do something about this hack
 */
if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

try {
	my_network_ep   = network_info.network_ep ('app', name);
	auth_network_ep = network_info.auth_network_ep ();
	client_id       = get_from_store (`config/app/${name}/client_id`);
	client_secret   = get_from_store (`config/app/${name}/client_secret`);
}
catch (ex) {
	log.fatal ({ err : ex }, 'Config not set properly');
	throw ex;
}

log.debug ({ my_network_ep }, 'my network endpoint');
log.debug ({ auth_network_ep }, 'auth network endpoint');

passport.use('oauth2', new OAuth2Strategy({
	clientID         : client_id,
	clientSecret     : client_secret,
	callbackURL      : `${my_network_ep}/callback`,
	authorizationURL : `${auth_network_ep}/login`,
	tokenURL         : `${auth_network_ep}/token/oauth2`,
},
	function (accessToken, refreshToken, params, profile, done) {
		if (accessToken) {
			log.debug ({ accessToken }, 'sending access token');
			log.debug ({ profile }, 'profile');
			log.debug ({ params }, 'params');
			return done (null, accessToken);
		}
	}
));

/* GET home page. */
router.get('/', passport.authenticate('oauth2'));

router.get('/callback', passport.authenticate('oauth2', {
	successRedirect : '/account',
	failureRedirect : '/',
}));

router.get('/account', ensure_authenticated, function (req, res, next) {
	res.send (`Hello ${req.user.name}`);
});

function ensure_authenticated ( req, res, next ) {
	if (req.isAuthenticated()) {
		log.debug ('authenticated ok');
		return next();
	}

	log.debug ('not authenticated');
	res.redirect('/');
}

function get_from_store (key) {
	var val = store.get (key);

	if (!val)
		throw `no config set for ${key}`;

	return val;
}

module.exports = router;
