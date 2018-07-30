var user_api = require ('apps/common/lib/user/api');
var log      = require ('common/log').child ({ module : 'apps/hello/controllers/user'});

var controller = {};

controller.ping = function (req, res, next) {
	user_api.ping ()
		.then (
			(version) => { res.send (version); },
			(err)     => { log.error ({ err : err }, 'ping failed'); res.status (err.status_code).send (`${err.key} : ${err.message}`); },
		);
};

controller.get_version = function (req, res, next) {
	user_api.get_version ()
		.then (
			(version) => { res.send (version); },
			(err)     => { log.error ({ err : err }, 'get_version failed'); res.status (err.status_code).send (`${err.key} : ${err.message}`); },
		);
};

module.exports = controller;
