var moment   = require ('moment');
var store    = require ('common/store');
var Error_3A = require ('common/3a-error');

var uptime = {};

uptime.get = function (req, res, next) {
	var start_ts = store.get ('start_ts');

	if (!start_ts)
		return res.status (500).send (new Error_3A ('WTF_ERROR', 500, 'WTF ! Couldn\'t get the service start time.').serialize());

	return res.send ({
		start_ts : start_ts,
		ago      : moment (start_ts).fromNow ()
	});
};

module.exports = uptime;
