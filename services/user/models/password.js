var promise         = require ('bluebird');
var moment          = require ('moment');
var user_schema     = require ('../schema/user');
var password_schema = require ('../schema/password');

var model = {};

model.get_password = function (id) {
	return new promise (async (resolve, reject) => {
		try {
			var password = password_schema.model ();
			var result   = await password.findOneById (id);

			if (!result)
				throw 'No such user';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.set_password = function (data) {
	return new promise (async (resolve, reject) => {
		try {
			var password = password_schema.model ();
			var result   = await password.add (data);

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.info_id = function (id) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var result = await user.findOneById (id);

			if (!result)
				throw 'No such user';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.info_email = function (email) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var select = { _id : 0, id : 1, firstName : 1, lastName : 1, email : 1 };
			var result = await user.findAllByEmail (email, select);

			if (!result.length)
				throw 'No such user';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.reset_password = function (id, data) {
	return new promise (async (resolve, reject) => {
		try {
			var password = password_schema.model ();
			var result   = await password.update (id, data);

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.update_password = function (id, data) {
	return new promise (async (resolve, reject) => {
		try {
			var password = password_schema.model ();
			var result   = await password.update (id, data);

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

module.exports = model;
