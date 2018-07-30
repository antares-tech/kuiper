var sprintf  = require ('sprintf-js').sprintf;
var promise  = require ('bluebird');
var minimist = require ('minimist');
var consul   = require ('consul')();

var service  = {};
var argv     = minimist (process.argv.slice(2));

service.get = async function (name) {
	var _d = promise.pending ();

	consul.catalog.service.nodes({ service : name }, (err, result) => {
		if (err)
			return _d.reject (err);

		return _d.resolve (result);
	});

	return _d.promise;
};

service.get_one = async function (name, id) {
	var _d = promise.pending ();

	try {
		let data = await service.get (name);
		let node = null;

		for (var i = 0; i < data.length; i++) {
			if (data[i].ServiceID == id) {
				node = data[i];
				break;
			}
		}

		if (!node)
			throw new Error (`no instances of service "${name}" with service id "${id}" found`);

		_d.resolve ({
			host : node.ServiceAddress,
			port : node.ServicePort,
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
}

function show_list (data) {
	console.log (sprintf (
		"%2s %-40s %-16s %-16s %-8s %-8s    %s",
		"#",
		"ID",
		"NAME",
		"ADDRESS",
		"PORT",
		"NODE",
		"UPTIME"
	));
	console.log ('--------------------------------------------------------------------------------------------------------------');

	for (var i = 0; i < data.length; i++) {
		if (!data[i].uptime)
			data[i].uptime = '-';

		var uptime_word = data[i].uptime.replace (/^err :/g, '');
		var is_error = data[i].uptime.startsWith ('err :');
		var line = sprintf (
			"%2s %-40s %-16s %-16s %-8s %-8s    %s",
			i + 1,
			data[i].ServiceID,
			data[i].ServiceName,
			data[i].ServiceAddress,
			data[i].ServicePort,
			data[i].Node,
			data[i].uptime
		);

		var colored_line = is_error ? colors.red (line) : line;
		console.log (colored_line);
	}
}

module.exports = service;
