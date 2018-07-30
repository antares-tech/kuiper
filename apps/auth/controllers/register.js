var crypto  = require('crypto');
var log     = require('common/log');
var model   = require('apps/auth/models/clients');
var jwt     = require('apps/auth/lib/token-verify/jwt');

var register = {};

register.entry = function (req, res, next) {

	var query    = req.query;
	var init_tok = query.init_tok;

	var body     = req.body;

	if (req.query && req.init_tok) {
		jwt.verify_signature (init_tok, {}, function (err, decodedPayload) {
			if (!err) {
				verified_client = true;
				return;
			}

			verified_client = false;
			log.info ("Access token verification error", {err : err});

			see_global_check ();
		});
	}

	/*
	 * should there be a init token or should be a paramater to define its confidence
	 * 
	 * var init_tok = req.query.token;
	 *
	 */

	if (!body)
		return res.status(403).send('body' + body);

	if (!body.displayName && !body.callback_url)
		return res.status(403).send('require params displayName : ' + displayName +', callback_url : ' + callback_url);
	
	/* a check to find unique displayName from db and notify user
	 * about its status.
	 */

	var client = {
		display_name      : body.displayName,
		callback_url      : body.callback_url,
		authorization_url : body.auth_url || config.auth_url,
		token_url         : body.tok_url || config.tok_url,
		profile_url       : body.profile_url || config.profile_url,
		client_id         : crypto.randomBytes(24).toString('hex') + '-' + 'heimdallr.auth.com',
		client_secret     : crypto.randomBytes(32).toString('hex'),
		trusted_client    : verified_client ? true : false,
		sso_req           : body.sso_req || [],
	};

	model.add_client (client, function(err, params) {

		if (err) {
			log.error({err : err}, 'add error');
			res.status(500).send('Error : unable to add client to db. Try Again!');
		}

		log.info('Client added successfuly', {id : params.client_id});
		var json = JSON.stringify(params);
		res.status(200).send(json);
	});
};

/* test function */

function see_global_check () {
	log.info ("verfied_client : ", verified_client);
}

module.exports = register;
