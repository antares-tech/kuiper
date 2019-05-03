var pbkdf2       = require('pbkdf2');
var randomstring = require("randomstring");
var promise      = require("bluebird");
var log          = require ('common/log').child({ module : 'common/utils' });

var utils = {};

utils.id_validate = function (id) {
	var obj = id.split(":");
	var user_id  = obj[0];
	var auth_via = obj[1];

	if (obj.length > 2)
		return false;
	
	if (!user_id || !auth_via)
		return false;

	if (user_id.match (/^[a-zA-Z0-9\-_.@\.]+$/) && auth_via.match (/^[a-zA-Z0-9\-_]+$/))
		return true;

	return false;
}; 

module.exports = utils;
