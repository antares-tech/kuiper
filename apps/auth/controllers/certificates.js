var url      = require ('url');
var passport = require('passport');
var log      = require('common/log');
var certs    = require('apps/auth/common/certificates');

var controller = {};

controller.get_certificates = function (req, res, next) {

	var json;
	try {
		json =  certs.utils.get_json ();
	}
	catch (ex) {
		if (ex.code == 'ENOENT'){
			log.warn ({err : ex}, `No such file exists, Unable to fetch json for certs`);
		}
	}	

	res.status(200).send(json);
};

module.exports = controller;
