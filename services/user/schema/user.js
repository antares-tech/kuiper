var promise   = require ('bluebird');
var moment    = require ('moment');
var mongoose  = require ('mongoose');
var log       = require ('common/log').child({ module : 'schema/user' });
var Error_3A  = require ('common/3a-error');
var __db      = require ('services/common/lib/db');
var utils     = require ('../common/utils');

promise.promisifyAll (mongoose);
mongoose.Promise = promise;

var Schema = mongoose.Schema;

var user_schema = new Schema (
	{
		id         : { type : String, required : true, index : { unique: true }, lowercase : true, validate: { validator: utils.id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		firstName  : { type : String, required : true },
		lastName   : { type : String, required : true },
		email      : { type : String, index : true, lowercase: true, match : /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ },
		status     : { type : String, required : true, enum : [ 'active', 'suspended', 'removed' ] },
		custom     : { type : Schema.Types.Mixed, default : {} },
		createdTs  : { type : Date,   required : true },
		createdBy  : { type : String, required : true, lowercase : true, validate: { validator: utils.id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		modifiedTs : { type : Date },
		modifiedBy : { type : String, lowercase : true, validate: { validator: utils.id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		version    : { type : Number, default : 0 },
		orgId      : { type : Schema.Types.ObjectId, required : true },
		roleId     : { type : Schema.Types.ObjectId, required : true },
	}
);

/* Db functions */

user_schema.statics.get = function (query) {

	if (query.orgId) {
		if (query.orgId === '*')
				delete query.orgId;
		else
			query.orgId = mongoose.Types.ObjectId (query.orgId);
	}

	log.debug ({ query : query }, 'query for user get');

	return new promise (async (resolve, reject) => {
		try {
			var result = await this.find (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};
user_schema.statics.findAllByEmail = function (email, query) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.find ({ email : email }).select (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

user_schema.statics.getCustom = function (id, app_name, key) {
	return new promise (async (resolve, reject) => {
		try {
			var query = {};
			if (!key) {
				query[`custom.${app_name}`] = 1;
			}
			else {
				var keys = key.split (',');
				for (var i = 0; i < keys.length; i++) {
					query[`custom.${app_name}.${keys[i]}`] = 1;
				}
			}
			query["_id"] = 0;

			var result = await this.findOne ({ id : id }).select (query);
			var _result = result["custom"][app_name];
			return resolve (_result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

user_schema.statics.getBulkCustom = function (id_list, app_name, key) {
	return new promise (async (resolve, reject) => {
		try {
			var query = {};
			if (!key) {
				query[`custom.${app_name}`] = 1;
			}
			else {
				var keys = key.split (',');
				for (var i = 0; i < keys.length; i++) {
					query[`custom.${app_name}.${keys[i]}`] = 1;
				}
			}
			query["_id"] = 0;
			query["id"] = 1;
			query["firstName"] = 1;
			query["lastName"] = 1;

			var result = await this.find ({ id : { $in : id_list }}).select (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

user_schema.statics.updateCustom = function (id, app_name, key, value) {
	return new promise (async (resolve, reject) => {
		try {
			var model  = get_model ();
			var user   = await model.findOne ({ id : id });
			
			if (!user.custom[app_name])
				user.custom[app_name] = {};

			user.custom[app_name][key] = value; 
			user.modifiedTs = moment().utc().toString();
			user.markModified('custom');
			await user.save ();
			
			return resolve (true);
		}
		catch (err) {
			return reject (err);
		}
	});
};

user_schema.statics.findOneById = function (id, query) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.findOne ({ id : id }).select (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

user_schema.statics.findAll = function (query = {}) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.find ().select (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

user_schema.statics.findMany = function (id_list, query) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.find ({ id : { $in : id_list }}).select (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

user_schema.statics.add = function (data) {
	data.status     = 'active';
	data.createdTs  = moment().utc().toISOString();

	return new promise (async (resolve, reject) => {
		try {
			var result = await this.create (data);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

user_schema.statics.edit = function (id, data) {
	data.modifiedTs  = moment().utc().toISOString();

	return new promise (async (resolve, reject) => {
		try {
			if (!data.modifiedBy)
				throw '"modifiedBy" is mandatory';

			var result = await this.update ({ id : id }, data);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

function get_model () {
	var model = __db.db().model ('data', user_schema);
	return model;
};

module.exports = {
	model : get_model
};
