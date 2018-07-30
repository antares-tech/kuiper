require('app-module-path').addPath(__dirname + '/../../../../../');

var minimist      = require('minimist');
var mongoose      = require('apps/auth/common/db/mongoose');
var emitter       = mongoose.emitter;
var path          = require('path');
var crypto        = require('crypto');
var log           = require('common/log');
var model         = require('apps/auth/models/clients');
var client_schema = require('apps/auth/common/db/client-schema');
var locals        = require('common/kv');
var promise       = require('bluebird');

var mongo_url     = 'mongodb://localhost:27017/heimdallr?maxPoolSize=10';
var optional = 	'\r\n\n--------------------------OPTIONAL ARGS--------------------------------\r\n\n' +
						'PARAM                 VALUE      TYPE   | Example\r\n\n' +

						'--sso_req             <sso-req>  String | facebook+google\n' +
						'--authorization_url   <url>      String | http://example.com/abc/auth\n' +
						'--token_url           <url>      String | http://example.com/abc/token\n' +
						'--profile_url         <url>      String | http://example.com/abc/profile\n';

var args    = minimist (process.argv.slice(2));

var params  = {};
if (!args.trusted)
	params.trusted_client = false;


if  (!args.display_name || !args.callback_url) {
	console.log('\r\nUsage : node ' + path.basename (process.argv[1]) + ' --display_name <String> --callback_url <URL>' + optional);
	process.exit(1);
}

function add_client (obj, cb) {

	return model.add_client (obj, cb);
}

function gen_random_str (len, encode, suffix) {

	var supported = ['hex', 'base64'];
	var random_str = '';

	if (typeof len === 'string') {
		suffix = supported.indexOf(len) > -1 ? undefined : len;
		encode = suffix ? 'base64' : len;
		len = 32;
	}

	if (typeof len !== 'number')
		throw new Error ('len must be a typeof number');

	if (typeof encode !== 'string')
		throw new Error ('encode must be a typeof string');
	if (supported.indexOf(encode)<0)
		encode='base64'

	if (typeof suffix !== 'string')
		suffix = undefined;

	try {
		random_str = crypto.randomBytes(len).toString(encode);
	}
	catch (ex) {
		throw ex;
	}

	if (suffix)
		return random_str + '-' + suffix;
	return random_str;
}

function get_baseUrl () {
	return new promise (async (resolve, reject) => {
		try {
			var proto = await locals.get ('config/global/protocol');
			var addr  = await locals.get ('config/global/addr');
			var port  = await locals.get ('config/app/global/auth/port');
			var url   = `${proto.Value}://${addr.Value}:${port.Value}`;

			return resolve (url);
		}
		catch (e) {
			console.error ('Error in getting base url from consul. Err: ' + e);
			process.exit (1);
		}
	});
}

emitter.on ('heimdallr.mongo.connected', async function () {

	
	if (args.sso_req && typeof args.sso_req === 'string') {
		args.sso_req = args.sso_req.split('+');
	}

	params.display_name      = args.display_name;
	params.client_id         = gen_random_str (24, 'hex', 'heimdallr.auth.com');
	params.client_secret     = gen_random_str (32, 'hex');
	params.callback_url      = args.callback_url;
	params.sso_req           = args.sso_req || [];
	params.authorization_url = args.authorization_url || await get_baseUrl () + '/authorize/oauth2';
	params.token_url         = args.token_url || await get_baseUrl () + '/token/oauth2';
	params.profile_url       = args.profile_url || '';

	log.info('++adding client params to db\r\n', params);

	add_client (params, function (err, client) {
		if (err)
			return log.error ('error occured', err);

		return log.info("client saved successfully", client);
	});
});
