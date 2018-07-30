var url           = require ('url');
var passport      = require('passport');
var log           = require ('common/log').child ({ module : 'auth/controller/login' });
var model         = require ('apps/auth/models/clients');

var login = {};

login.show = function (req, res, next) {

	/* req has client-id, 
	 * use it to find the client object from mongo
	 * search for the  sso_req param in client object 
	 * send the sso req object with jade itself.
	 *
	 * Handling of sso login buttons on front end side
	 */

	var query_str = url.parse (req.url).query;
	var client_id = req.query.client_id;

	if (!client_id) {
		log.error ({ query : req.query }, 'incoming request with no client id. rejected');
		return res.status (400).send ('request with no client id. rejected.');
	}

	model.get ('cid', client_id, function (err, client_info) {

		if (err)
			return res.status (403).end ('nothing is known about this client. forbidden.');

		var sso = client_info.sso_req;

		if (has (sso, 'local') && has (sso, 'anon'))
			return res.render ('session/login-with-anon', {
				query : query_str,
				err   : req.login_err ? req.login_err.err : null,
				msg   : req.login_err ? req.login_err.msg : null,
			});

		/*
		 * Else default to this
		 */
		res.render ('session/login', {
			query : query_str,
			err   : req.login_err ? req.login_err.err : null,
			msg   : req.login_err ? req.login_err.msg : null,
		});
	});
};

function has (sso, str) {
	return sso.indexOf (str) !== -1;
}

login.__authenticate__ = function (req, res, next) {

	var username = req.body.username;
	var password = req.body.password;

	var query   = url.parse (req.url).query;

	/*
	 * Show the form again if the username or password is not populated
	 */
	if (!username || !password) {
		req.login_err = {
			err : 'invalid or insufficient input',
			msg : 'invalid or insufficient input',
		};

		return login.show (req, res, next);
	}

	passport.authenticate ('local', function (err, user, info) {

		if (err || !user) {
			var status_code = err && err.status_code || 500;
			var message     = err && err.msg || 'internal server error';

			log.warn ({ strategy : 'local', err : err, status_code : status_code, message : message }, 'authentication failed. returning error.');

			req.login_err = {
				err : err,
				msg : message
			};

			return login.show (req, res, next);
		}

		req.logIn (user, function (err) {
			if (err)
				return next (err);

			return res.redirect (`authorize/oauth2?${query}`);
		});

	})(req, res, next);
};

login.__authenticate__anon__ = function (req, res, next) {

	var username = req.body.username;

	/*
	 * Hack to make the passport work. It seems it checks for these fields
	 * and doesn't work properly if these are not set */
	req.body.password = 'dummy';

	var query   = url.parse (req.url).query;

	/*
	 * Show the form again if the username or password is not populated
	 */
	if (!username) {
		req.login_err = {
			err : 'invalid or insufficient input',
			msg : 'invalid or insufficient input',
		};

		return res.redirect (`/login?${query}`);
		return login.show (req, res, next);
	}

	passport.authenticate ('anon', function (err, user, info) {

		if (err || !user) {
			var status_code = err && err.status_code || 500;
			var message     = err && err.msg || 'internal server error';

			log.warn ({ strategy : 'anonymous', err : err, status_code : status_code, message : message }, 'authentication failed. returning error.');

			req.login_err = {
				err : err,
				msg : message
			};

			return login.show (req, res, next);
		}

		req.logIn (user, function (err) {
			if (err)
				return next (err);

			return res.redirect (`/auth/authorize/oauth2?${query}`);
		});

	})(req, res, next);
};

module.exports = login;
