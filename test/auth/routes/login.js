var express = require('express');
var router = express.Router();
var passport = require ('passport');
var OAuth2Strategy = require ('../common/mobile-strategy');
var log = require('../common/log');


passport.use ( "mobile-strategy", new OAuth2Strategy({
	clientID : "XveJSIFyskeYlDQt1UK8qA==",
	clientSecret : "zGAoH4eslaIXPNqS3ZTx4A==",
	callbackURL : "http://192.168.8.129:2000/callback",
	authorizationURL : "http://192.168.8.129:3000/mobile/auth/google",
	tokenURL : "http://192.168.8.129:3000/token/oauth2",
},
	function (accessToken, refreshToken, params, profile, done) {
		log.info ({profile : profile}, "passport verify callback client side");
		log.info (accessToken, "accesstoken recieved");
		log.debug (' _sending_ access token.....');
		done (null, {
			access_token : accessToken
		});
	}
));


function __authenticate__ (req, res, next) {
	var id_token = req.query.id_token;

	if (!id_token)
		return res.status(500).send ('id_token missing');

	return passport.authenticate ('mobile-strategy', {id_token : id_token})(req, res, next);
}

/* GET home page. */
router.get('/', __authenticate__);

router.get('/callback', passport.authenticate("mobile-strategy"), function (req, res, next) {
	res.status (200).send (req.user);
});

router.get('/account', ensure_authenticated, function (req, res, next) {
	res.send ("Hello World");
});

function ensure_authenticated ( req, res, next ) {
	if (req.isAuthenticated()) {
		return next();
	}

    return res.render('error_auth.jade', { header : 'Auth Status', err : 'not authenticated' });
}

module.exports = router;
