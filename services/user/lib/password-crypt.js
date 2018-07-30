var pbkdf2       = require('pbkdf2');
var randomstring = require("randomstring");
var promise      = require("bluebird");
var log          = require('common/log').child({ module : 'lib/password-crypt' });
var store        = require('common/store');

var cfunc = {};

cfunc.encrypt_password = (clear_text, custom = null) => {
	var s_length  = parseInt(store.get ('config/srv/user/password/salt/length')),
		s_charset = store.get ('config/srv/user/password/salt/charset'),
		salt      = custom && custom.salt   || randomstring.generate({ length  : s_length, charset : s_charset }),
		s_rounds  = custom && custom.rounds || Math.floor((Math.random() * 9) + 1),
		p_length  = custom && custom.length || parseInt(store.get ('config/srv/user/password/length')),
		p_digest  = custom && custom.digest || store.get ('config/srv/user/password/digest');

	var option_set = {
		salt   : salt,
		rounds : s_rounds,
		length : p_length,
		digest : p_digest
	};

	return new promise ((resolve, reject) => {
		pbkdf2.pbkdf2(
			clear_text,
			option_set.salt, 
			option_set.rounds,
			option_set.length, 
			option_set.digest, (err, encrypted_key) => {
				if (err)
					return reject (err);

				var data = {
					password : encrypted_key.toString('hex'),
					salt     : option_set.salt,
					rounds   : option_set.rounds,
					length   : option_set.length,
					digest   : option_set.digest
				};

			return resolve (data);
		});
	});
};

module.exports = cfunc;
