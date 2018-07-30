var consul     = require ('consul')({ promisify : true });
var store      = require ('./store');

var kv = {};

kv.get = function (key, options) {

	return new Promise ((resolve, reject) => {

		var __options = {
			key    : key,
			recurse: options && options.recurse || false,
		};

		consul.kv.get (__options, function (err, result) {

			if (err)
				return reject (err);

			resolve (result);
		});
	});
};

kv.get_and_store = function (key, options) {

	return new Promise ((resolve, reject) => {

		var __options = {
			key    : key,
			recurse: options && options.recurse || false,
		};

		consul.kv.get (__options, function (err, result) {

			if (err)
				return reject (err);

			if (!result)
				return resolve ();

			for (var i = 0; i < result.length; i++)
				store.set (result[i].Key, result[i].Value);

			resolve (result);
		});
	});
};

module.exports = kv;
