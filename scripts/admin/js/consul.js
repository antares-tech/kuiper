var consul     = require ('consul')({ promisify : true });

var consul_routines = {};

consul_routines.list_all = async function () {
	return new Promise (async (resolve, reject) => {

		consul.catalog.service.list ({}, function (err, result) {
			if (err) {
				console.error ('consul.service.list failed : ' + err);
				return reject (err);
			}

			resolve (result);
		});
	});
};

consul_routines.set_key = async function (key, val) {
	return new Promise (async (resolve, reject) => {

		var options = {
			key   : key,
			value : val
		};

		consul.kv.set (options, function (err, result) {
			if (err) {
				console.error ('consul.set_key failed : ' + err);
				return reject (err);
			}

			resolve (result);
		});
	});
};

consul_routines.get_key = async function (key) {
	return new Promise (async (resolve, reject) => {

		var options = {
			key   : key,
			recurse : true
		};

		consul.kv.get (options, function (err, result) {
			if (err) {
				console.error ('consul.get_key failed : ' + err);
				return reject (err);
			}

			resolve (result);
		});
	});
};

module.exports = consul_routines;
