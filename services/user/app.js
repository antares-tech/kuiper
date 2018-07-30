var moment  = require ('moment');
var store   = require ('common/store');
var log     = require ('common/log').child({ module : 'app' });
var promise = require ('bluebird');
var __db    = require ('services/common/lib/db');

var admin    = require ('./routes/admin');
var password = require ('./routes/password');
var profile  = require ('./routes/profile');
var roles    = require ('./routes/roles');

var app = {};

app.args     = require ('./args');
app.pre_init = (express_app, startup_data) => {
	return new promise ((resolve, reject) => {
		resolve ();
	});
};

app.add_routes = (express_app) => {
	express_app.use('/ping', (req, res, next) => { return res.send ('pong'); });
	express_app.use('/admin', admin);
	express_app.use('/profile', profile);
	express_app.use('/password', password);
	express_app.use('/role', roles);
};

app.post_init = function (express_app) {

	return new promise ((resolve, reject) => {
		var db_path =store.get ('config/srv/user/db');

		if (!db_path) {
			log.error ('incomplete configuration : config/srv/user/db not set');
			return reject ('incomplete configuration');
		}

		__db.init (db_path)
			.then (
				() => { resolve (); },
				(err) => { reject (err); }
			);
	});
};

module.exports = app;
