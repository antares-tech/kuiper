var promise           = require ("bluebird");
var user_schema       = require ('../schema/user');
var ScopeToMongoQuery = require ('apps/common/lib/user/class').ScopeToMongoQuery;

var model = {};
var Scope = new ScopeToMongoQuery ({
	orgId : 'orgId',
	id    : 'id'
});

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

model.bulk = function (id_list) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var select = { _id : 0, id : 1, firstName : 1, lastName : 1, email : 1 };
			var result = await user.findMany (id_list, select);
			
			if (!result)
			   throw 'No users';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.custom = function (id, app_name, key) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var result = await user.getCustom (id, app_name, key);

			if (!result)
				throw 'No data';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.bulk_custom = function (id_list, app_name, key) {
	return new promise (async (resolve, reject) => {
		try {
			var user   = user_schema.model ();
			var result = await user.getBulkCustom (id_list, app_name, key);

			if (!result)
				throw 'No data';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

model.all = function (scope) {
	return new promise (async (resolve, reject) => {

		try {
			var query  = Scope.toMongoQuery (scope);
			var user   = user_schema.model ();
			var result = await user.find (query);
			
			if (!result.length)
			   throw 'No users';

			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

module.exports = model;
