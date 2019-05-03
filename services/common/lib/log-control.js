var moment   = require ('moment');
var store    = require ('common/store');
var log      = require ('common/log');
var Error_3A = require ('common/3a-error');

var log_ctrl = {};

log_ctrl.get_level = function (req, res, next) {
	var levels   = log.levels ();
	var response = {};

	if (process.env.NODE_ENV !== 'production') {
		response.stdout = log.level_name (levels[0]);
		response.nats   = log.level_name (levels[1]);
	}
	else {
		response.file   = log.level_name (levels[0]);
		response.nats   = log.level_name (levels[1]);
	}

	return res.send (response);
};

log_ctrl.set_level = function (req, res, next) {
	var stream   = req.params.stream;
	var level    = req.params.level;
	var module   = req.params.module;
	var response = {}, stream_id;

	try {
		log.set_level (stream, level, module);
	}
	catch (e) {
		var err = e;

		if (e instanceof Error)
			err = e.message;

		log.error ({ err : err, stack : e.stack }, 'set log level failed');
		return res.status (400).send(err);
	}

	return res.send ('ok');
};

module.exports = log_ctrl;
