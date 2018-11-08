var colors      = require ('colors');
var execFile    = require ('child_process').execFile;
var promise     = require ('bluebird');

var start = {};

function form_args_array (data) {
	var arr = [];

	for (var i = 0; i < data.length; i++) {
		arr.push (data[i]['key']);
		arr.push ('"' + data[i]['value'] + '"');
	}

	return arr;
}

start.run = function (job, argv) {
	var p = promise.pending ();

	var arg_arr = form_args_array (job.data.args);
	var path    = job.data.path;

	execFile (path, arg_arr, { shell : true }, (err, stdout, stderr) => {
		if (err) {
			console.log ();
			console.log (colors.red (stderr));
			console.log (colors.yellow ('>>>>>>> stdout'));
			console.log (stdout);
			console.log (colors.yellow ('<<<<<<< stdout'));
			return p.reject (err);
		}

		if (argv.debug) {
			console.log (colors.yellow ('>>>>>>> stdout'));
			console.log (stdout);
			console.log (colors.yellow ('<<<<<<< stdout'));
		}

		return p.resolve ();
	});

	return p.promise;
}

module.exports = start;
