var minimist = require ('minimist');
var args = minimist(process.argv.slice(2));
var kv = require ('./kv');

if (!args['service-name']) {
	console.error ('--service-name argument missing');
	process.exit (1);
}

kv.init (args['service-name'])
	.then (
		function (config_arr) {
			var config = {};

			for (var i = 0; i < config_arr.length; i++) 
				config[config_arr[i].Key] = config_arr[i].Value;

			require ('./start')({
				config : config
			});
		},
		function (err) {
			console.error ('pre-startup failed : err = ' + err);
		}
	);
