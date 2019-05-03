var promise         = require ('bluebird');
var mongoose        = require ("mongoose");
var moment          = require ('moment');
var roles_model     = require ('../schema/roles');
var PermsClass      = require ('../lib/perms-class');

var role = {};

role.add = async function (data) {
	var p = promise.pending();

	try {

		if (!data.perms)
			throw new Error ('no perms specified');

		var Perms  = new PermsClass (data.perms);

		data.perms = Perms.forDB();
		var result = await roles_model().add (data);

		p.resolve (result);

	}
	catch (err) {
		p.reject (err);
	}

	return p.promise;
};

role.edit = async function (id, data) {
	var p = promise.pending();

	try {

		if (!data.perms)
			throw new Error ('no perms specified');

		if (!data._id || data._id != id)
			throw new Error ('no _id or id mismatch');

		var Perms  = new PermsClass (data.perms);

		data.perms      = Perms.forDB();
		data.modifiedTs = moment().toISOString ();

		var result = await roles_model().replaceById (id, data);

		p.resolve (result);

	}
	catch (err) {
		log.error ({error : err, stack : err.stack}, 'Error at role edit');
		p.reject (err);
	}

	return p.promise;
};

role.list = async function (scope) {
	var p = promise.pending();
	var query = {};
	var result;

	try {
		if (!scope) {
			log.warn ('no scope. returning empty list');
			p.resolve ([]);
			return p.promise;
		}
		
		if (scope._id && Array.isArray (scope._id)) {
			scope._id.forEach ((value, index) => {
				scope._id[index] = mongoose.Types.ObjectId (value);
			});
			query._id = { $in : scope._id };
		} else if (scope._id && scope._id !== '*')
			query._id = mongoose.Types.ObjectId (scope._id);

		if (query._id) {
			result = await roles_model().find (query);
		} else {
			result = await roles_model().find ();
		}
		p.resolve (result);

	}
	catch (err) {
		log.error ({error : err, stack : err.stack}, 'Error at role list with scope');
		p.reject (err);
	}

	return p.promise;
};

role.get = async function (id) {
	var p = promise.pending();

	try {
		var result;

		result = await roles_model().findById (id);

		p.resolve (result);

	}
	catch (err) {
		log.error ({error : err, stack : err.stack}, 'Error at role get');
		p.reject (err);
	}

	return p.promise;
};

role.getByName = async function (name) {
	var p = promise.pending();

	try {
		var result;

		result = await roles_model().findOne ({ name : name });

		p.resolve (result);

	}
	catch (err) {
		log.error ({error : err, stack : err.stack}, 'Error at role get by name');
		p.reject (err);
	}

	return p.promise;
};

module.exports = role;
module.exports.emitter = roles_model.emitter;
module.exports.init = roles_model.init;
