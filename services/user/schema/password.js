var promise   = require ('bluebird');
var moment    = require ('moment');
var mongoose  = require ('mongoose');
var log       = require ('common/log').child({ module : 'schema/password' });
var Error_3A  = require ('common/3a-error');
var utils     = require ('../common/utils');
var __db      = require ('services/common/lib/db');

promise.promisifyAll (mongoose);
mongoose.Promise = promise;

var Schema = mongoose.Schema;

var password_schema = new Schema (
	{
		id         : { type : String, required : true, index : { unique: true }, lowercase : true, validate: { validator: utils.id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		password   : { type : String, required : true },
		salt       : { type : String, required : true },
		rounds     : { type : Number, required : true },
		length     : { type : Number, required : true },
		digest     : { type : String, required : true },
		createdTs  : { type : Date,   required : true },
		modifiedTs : { type : Date },
		version    : { type : Number, default : 0 },
	}
);

/* Db functions */
password_schema.statics.findOneById = function (id) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.findOne ({ id : id });
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

password_schema.statics.add = function (data) {
	/* Adding required attributes */
	data.createdTs  = moment().utc().toISOString();

	return new promise (async (resolve, reject) => {
		try {
			var result = await this.create (data);
			return resolve (result.id);
		}
		catch (err) {
			return reject (err);
		}
	}); 
};

password_schema.statics.update = function (id, data) {
	/* Adding required attributes */
	data.modifiedTs = moment().utc().toString();

	return new promise (async (resolve, reject) => {
		try {
			var opts   = { new : true, runValidators : true, upsert : true };
			var result = await this.findOneAndUpdate ({ id : id }, { $set : data }, opts);
			return resolve (result.id);
		}
		catch (err) {
			return reject (err);
		}
	});
};

function get_model () {
	var model = __db.db().model ('password', password_schema);
	return model;
};

module.exports = {
	model : get_model
};

