var express            = require ('express');
var router             = express.Router ();
var passport           = require ('passport');
var local_strategy     = require ('passport-local');
var url                = require ('url');
var log                = require ('common/log').child ({ sub_module : '/routes/login' });
var login              = require ('apps/auth/controllers/login');
var user_serialization = require ('apps/auth/common/serialization/users');
var user               = require ('apps/common/lib/user/api');

var email_regex = new RegExp (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

passport.use ('local', new local_strategy (async function verify(name, password, done) {
	/* get user from mongo, and verifying the user details */
	var __user_info = null;

	try {
		if (email_regex.test (name))
			__user_info = await user.match_password_by_email (name, password);
		else
			__user_info = await user.match_password (`${name}:local`, password);

		log.debug ({ __user_info }, 'user info');

		__user_info.d = (new Date()).toISOString ();

		return done (null, __user_info);

	} catch (e) {

		log.warn ({ _msg : e, username : name }, 'login failed');
		return done (e, null);
	}

}));

passport.use ('anon', new local_strategy (async function verify(name, password, done) {

	try {

		var d = new Date ();
		return done (null,  {
			id        : name,
			firstName : name,
			lastName  : null,
			email     : null,
			d         : d.toISOString(),
		});

	} catch (e) {

		log.warn ({ _msg : e, username : name }, 'login failed');
		return done (e, null);
	}

}));

passport.serializeUser (user_serialization.serializer);
passport.deserializeUser (user_serialization.deserializer);

router.get ('/',    login.show);
router.post('/',    login.__authenticate__);
router.post('/anon',login.__authenticate__anon__);

module.exports = router;
