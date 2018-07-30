var sprintf  = require ('sprintf-js').sprintf;
var colors   = require ('colors');
var minimist = require ('minimist');
var consul   = require ('consul')();
var rest     = require ('./rest');

var service  = {};
var argv     = minimist (process.argv.slice(2));

service.get = async function (name) {
	return new Promise ((resolve, reject) => {

		consul.catalog.service.nodes({ service : name }, (err, result) => {
			if (err)
				return reject (err);

			return resolve (result);
		});
	});
};

/*
 * 1. get services list
 * 2. if multiple services then report and exit
 * 3. if multiple sercvies and index provided then choose that instance and go
 * 4. Make the rest call
 */

service.get_one = async function (name) {
	return new Promise (async (resolve, reject) => {

		var data;

		try {
			data = await service.get (name);

			if (!data.length)
				return reject ('no instances of service "' + name + '" found');

			if (data.length > 1) {
				if (!argv.instance) {
					show_list (data);
					console.error (colors.red ('Please choose an instance # using the --instance argument and re-run this command.'));
					return reject ('too many instances');
				}

				/* If we come here, then an instance # has been provided */

				if (argv.instance < 1 || argv.instance > data.length) {
					show_list (data);
					console.error (colors.red ('Service instance not found. Please choose an instance # using the --instance argument and re-run this command.'));
					return reject ('incorrect instance number');
				}

				return resolve (data [argv.instance - 1]);
			}

			return resolve (data[0]);
		}
		catch (e) {
			console.error ( colors.red ('Err : get_one : ' + e));
			return reject (e);
		}
	});
}

service.deregister = async function (id) {
	return new Promise ((resolve, reject) => {

		consul.agent.service.deregister({ id : id }, (err, result) => {
			if (err)
				return reject (err);

			console.log (`deregister of "${id}" ok`);
			return resolve (result);
		});
	});
};

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

service.get_all = () => {
	return new Promise (async (resolve, reject) => {

		consul.catalog.service.list ({}, async function (err, result) {
			if (err) {
				console.error ('consul.service.list failed : ' + err);
				return reject (err);
			}

			var service_data = [];
			for (var name in result) {
				if (name === 'consul')
					continue;
				try {

					var __service_data = await service.get (name);

					/* For each service get it's uptime */
					for (var i = 0; i < __service_data.length; i++) {
						try {
							var uptime = await rest.get (`http://${__service_data[i].ServiceAddress}:${__service_data[i].ServicePort}/common/uptime`);
							__service_data[i].uptime = uptime.ago;
						} catch (e) {
							__service_data[i].uptime = `err : ${e}`;
						}
					}

					service_data = service_data.concat (__service_data);
				} catch (e) {
					/* continue */
				}
			}

			show_list (service_data);

			resolve (result);
		});
	});
};

module.exports = service;
