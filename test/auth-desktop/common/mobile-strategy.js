var OAuth2Strategy     = require ('passport-oauth2');
var InternalOAuthError = OAuth2Strategy.InternalOAuthError;
var util               = require ('util');
var log                = require ('../common/log');

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

Strategy.prototype.authorizationParams = function (options) {
	log.info ('overrided authorization params');
	var params = {};

	if (options.id_token)
		params.id_token = options.id_token;

	return params;
};

module.exports = Strategy;
