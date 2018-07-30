var log       = require ('common/log').child ({ module : 'req-tracker'});

var tracker   = {};
var count_in  = 0;
var count_out = 0;
var count_err = 0;

tracker.count_in = function (req, res, next) {
	count_in ++;
	next ();
};

tracker.count_out = function (req, res, next) {
	res.on ('finish', function () {
		res.statusCode === 200 ? count_out ++ : count_err ++;
	});

	next ();
};

tracker.get = () => {
	return {
		in  : count_in,
		out : count_out,
		err : count_err
	};
};

module.exports = tracker;
