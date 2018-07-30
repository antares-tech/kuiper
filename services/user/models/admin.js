var promise         = require ('bluebird');
var moment          = require ('moment');
var user_schema     = require ('../schema/user');

var model = {};

model.add = function (data) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var result = await user.add (data);

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.edit = function (id, data) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var result = await user.edit (id, data);

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.custom = function (id, app_name, key, value) {
	return new promise (async (resolve, reject) => {
		try {
			var user = user_schema.model ();
			var result = await user.updateCustom (id, app_name, key, value);

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

module.exports = model;
