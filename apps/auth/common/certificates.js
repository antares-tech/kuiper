var fs             = require('fs');
var uid2           = require('uid2');
var log            = require('./log');
var certs_filepath = 'certs/public.pem';

var certificates = {};

certificates.get_json = function () {
	var str;
	var json;
	var jsonfile = 'utils/3ACerts.json';
	try {
		str  = fs.readFileSync (jsonfile, 'utf-8');
		json = JSON.parse (str);
	}
	catch (ex) {
		if (ex.code == 'ENOENT') {
			throw ex;
		}
		
		log.error ({err : ex}, `error in reading file at path --> ${jsonfile}`);
		throw ex;
	}

	return json;
};

function read_certs () {
	try {
		certs = fs.readFileSync('certs/public.pem', 'utf-8');
	}
	catch (ex) {
		log.error ({err : ex}, 'error in reading certificates file at path -->', certs_filepath);
		return;
	}

	return certs;
}

function generate_json (cert_file) {
	var json = {};
	var filename = '3ACerts.json';

	if (typeof cert_file !== 'string')
		throw new Error('cert_file must be a string');

	var str =  read_certs();
	var delimeted_certs = str.split ('\n\n');

	for (var i=0; i<delimeted_certs.length; i++) {
		var kid = uid2(40);
		json[kid] = delimeted_certs[i];
	}

	var stringified = JSON.stringify(json);
	try {
		fs.writeFileSync( 'utils/' + filename, stringified, 'utf-8');
	}
	catch (ex) {
		log.error ({err : ex}, `error in writing to file at path --> apps/utils/${filename}`);
	}
}

module.exports = generate_json;
module.exports.utils =  certificates;
