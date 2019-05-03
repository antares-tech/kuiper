var promise   = require ('bluebird');
var moment    = require ('moment');
var mongoose  = require ('mongoose');
var log       = require ('common/log').child({ module : 'schema/roles' });
var Error_3A  = require ('common/3a-error');
var db        = require ('services/common/lib/db');
var utils     = require ('../common/utils');

promise.promisifyAll (mongoose);
mongoose.Promise = promise;

var Schema = mongoose.Schema;

/*
 * The structure of "perms" is as follows:
 *     perms => {
 *         'tag1' : {
 *             scope : any of('*' | ':self' | [ list ]
 *
 *             verb1 : {
 *                 allowed : true|false
 *                 scope : any of ('*' | ':self' | [ list ] (defaults to global scope if not specified)
 *             }
 *             verb2 : {
 *                 allowed : true|false
 *                 scope : any of ('*' | ':self' | [ list ] (defaults to global scope if not specified)
 *             }
 *         }
 *         'tag2' : {
 *             ...
 *     }
 */

var Role = new Schema (
	{
		name       : { type : String, required : true, unique : true, dropDups : true },
		perms      : { type : {}, required : true },
		createdTs  : { type : Date,   required : true },
		createdBy  : { type : String, required : true, lowercase : true, validate: { validator: utils.id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		modifiedTs : { type : Date },
		modifiedBy : { type : String, lowercase : true, validate: { validator: utils.id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
	}
);

function handleE11000 (error, res, next) {
	if (error.name === 'MongoError' && error.code === 11000) {
		next(new Error('There was a duplicate key error'));
	} else {
		next();
	}
}

Role.statics.add = function (data) {
	var p = promise.pending ();

	data.createdTs = moment().toISOString ();

	this.create(data, (err, result) => {

		if (err) {
			if (err.name == 'MongoError' && err.code === 11000) {
				return p.reject (new Error_3A ('ERRDUPLICATE', 403, 'already exists'));
			}
			else 
				return p.reject (new Error_3A ('ERR_MONGODB', 500, err.message));
		}

		p.resolve (result);
	});

	return p.promise;
};

Role.statics.replaceById = function (id, data) {
	var p = promise.pending ();

	var _id = mongoose.Types.ObjectId (id);

	this.findOneAndUpdate ({ _id : _id }, data, { overwrite : true, new : true }, (err, result) => {

		if (err) {
			return p.reject (new Error_3A ('ERR_MONGODB', 500, err.message));
		}

		p.resolve (result);
	});

	return p.promise;
};

module.exports = () => { return db.db().model ('role', Role); };
module.exports.emitter = db.emitter;
module.exports.init = db.init;
