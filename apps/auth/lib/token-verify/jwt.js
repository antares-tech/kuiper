var jwt  = require('jsonwebtoken');
var fs   = require('fs');
var log  = require('common/log').child ({ module : 'jwt' });

var __priv_cert_file = __dirname + '/../../certs/private.pem';
var private_cert     = fs.readFileSync (__priv_cert_file);
var private_key      = { key : private_cert, passphrase : 'heimdallr' };

var __pub_cert_file  = __dirname + '/../../certs/public.pem';
var public_key       = fs.readFileSync (__pub_cert_file);

var jsonwebtoken = {};

jsonwebtoken.generate = function (payload, cb) {

	var json = {};

	if (!payload) 
		throw new Error ("undefined payload");
	if (!cb) 
		throw new Error ("undefined callback function");

	payload.iat = Date.now ();
	payload.exp = Date.now () + (10*60*60);

	var options = {
		algorithm : 'RS256',
		issuer    : 'heimdallr.auth.com',
	};

	jwt.sign (payload, private_key, options, function (err, token ) {

		if (err) {
			log.error ({err : err}, `token signing error : ${err.message}`);
			cb(err, null);
		}

		cb (null, token);
	});
};

jsonwebtoken.verify_signature = function (token, options, cb) {

	if (!token || !cb) {
		return cb ('insufficient arguments', null);
	}

	if (!options)
		options = {};

	options.algorithms = [ 'RS256' ];
	options.issuer     = 'heimdallr.auth.com';

	log.debug ({ token : token }, 'verifying token signature');

	jwt.verify (token, public_key,  options, function (err, decoded) {
		if (err) {
			return cb (err, null);
		}

		return cb (err, decoded);
	});
};

module.exports = jsonwebtoken;
