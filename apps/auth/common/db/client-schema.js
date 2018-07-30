var mongoose = require ('mongoose');
var log      = require ('common/log');

var Schema = mongoose.Schema;

/* client db Schema */
var credential_schema = {
	app_type          : {type : String, required : true},
	display_name      : {type : String, required : true},
	cid               : {type : String, required : true},
	secret            : {type : String, required : true},
	callback_url      : {type : Array, required : true},
	grant_type        : {type : Array},
	response_type     : {type : Array},
	scope             : {type : Array},
	logo_uri          : {type : Array},
	contact           : {type : Array},
	sso_req           : {type : Array, default : []},
	trusted           : {type : Boolean, default : false},
};

function createSchema () {

	var	_schema = new Schema (credential_schema, { id : false });
	_schema.index ( {cid : 1}, {unique : true} );

	return _schema;
}

module.exports = createSchema();
