var OAuth2Strategy     = require ('passport-oauth2');
var InternalOAuthError = OAuth2Strategy.InternalOAuthError;
var util               = require ('util');
var log                = require ('common/log').child ({ module : 'our-strategy' });

function Strategy (options, verify) {
	options.clientID         = options.clientID;
	options.clientSecret     = options.clientSecret;
	options.authorizationURL = options.authorizationURL; // or authserver authorization endpoint
	options.tokenURL         = options.tokenURL;         // or authserver token endpoint'
	options.scopeSeparator   = options.scopeSeparator || ',';

	OAuth2Strategy.call (this, options, verify);
	this.name        = '3apples';
	this._profileURL = options.profileURL || 'http://shunya.local:3000/protected/user';               // or resource server endpoint;
}

util.inherits (Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function (accessToken, done) {
	var json;

	log.info ( "getting user profile using access token ", {accessToken : accessToken});

	var url = this._profileURL;
	this._oauth2.useAuthorizationHeaderforGET = true;

	this._oauth2.get (url, accessToken, function (err, body, res) {
		if (err) {
			log.error ( {err : err}, "Failed : fetching user profile");
			return done ( new InternalOAuthError ("Failed : fetching user profile", err));
		}

		try {
			json = JSON.parse(body);
		}
		catch (exc) {
			return done ( new InternalOAuthError ('Failed : fetching user profile', exc));
		}

		var profile = {};

		profile.id    = json.id;
		profile.email = json.email;

		done (null, profile);
	});
};

Strategy.prototype.authorizationParams = function (options) {
	var params = {};

	if (options.id_token)
		params.id_token = options.id_token;

	return params;
};

module.exports = Strategy;
