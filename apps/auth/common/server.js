var oauth2orize = require('oauth2orize');
var log         = require('common/log').child ({ module : 'auth/common/server' });

/* The module's creates a singleton server object(instance)
 * Single instance for performing all the processes in OAuth2 
 * through the same instance fo server returned from oauth2orize module
 */

var serverInstance;

function  createServer () {
	return __create_server__ ();
}

function __create_server__ () {
	if (!serverInstance) {
		log.info ('creating a oauth2 server instance');
		serverInstance = oauth2orize.createServer ();
	}

	return serverInstance;
}

/** 
 * registers handlers to the server for requests authorizing 
 * on behalf of users
 */
function __register_grant_code__ (options, issue)  {
	if (!serverInstance)
		createServer ();

	log.info ('Initiating middleware grant code registration . . .');
	serverInstance.grant (oauth2orize.grant.code (options, issue));
}

/** 
 * registers handlers to the server for requests asking access tokens
 * for authorized clients on behalf of a user
 */
function __register_exchange_code__ (options, issue)  {
	if (!serverInstance)
		createServer ();

	log.info ('Initiating middleware exchange code registration . . .');
	serverInstance.exchange (oauth2orize.exchange.authorizationCode (options, issue));
}

createServer ();

module.exports                        = serverInstance;
module.exports.createServer           = __create_server__;
module.exports.register_grant_code    = __register_grant_code__ ;
module.exports.register_exchange_code = __register_exchange_code__ ;
