require('app-module-path').addPath(__dirname + '/../../');

var express              = require('express');
var path                 = require('path');
var cookieParser         = require('cookie-parser');
var bodyParser           = require('body-parser');
var passport             = require('passport');
var session              = require('express-session');
var e_logger             = require('express-bunyan-logger');
var redis_store          = require('connect-redis')(session);
var log                  = require('common/log');
var store                = require('common/store');
var args                 = require('apps/common/args');
var server               = require('apps/auth/common/server');
var client_serialization = require('apps/auth/common/serialization/clients');

/* router files */
var certificates= require('apps/auth/routes/certificates');
var auth        = require('apps/auth/routes/auth');
var token       = require('apps/auth/routes/token');
var login       = require('apps/auth/routes/login');
var auth_mobile = require('apps/auth/routes/mobile-auth');

var app = express();

log.trace ('app.js starting ...');

var sess = {
	secret            : '3aAuthenticationSecret',
	saveUninitialized : true,
	resave            : true,
	store             : new redis_store ({ttl:24*60*60}),
	name              : '3a-auth'
	/*
	 * TODO: add secure & proxy trust */
};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

/*
 *  * Add express request logger */
app.use(e_logger({
	/* genReqId: function (req) { return req.req_id; }, */
	format: "HTTP :incoming :status-code :method :url :remote-address",
	excludes : [ 'req' , 'res', 'req-headers', 'res-headers', 'user-agent',
		'body', 'short-body', 'response-hrtime', 'http-version',
		'incoming', 'remote-address', 'method', 'url', 'status-code', 'ip'
	],
	levelFn : function (status, err, meta) {
		if (status >= 500)
			return 'error';
		if (status >= 400)
			return 'warn';
	},
	logger:log
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());

server.serializeClient (client_serialization.serializer);
server.deserializeClient (client_serialization.deserializer);

/* authorization urls for local-authentication via OAuth2.0 */
app.use('/login', login);
app.use('/authorize', auth);
app.use('/token', token);

/* web app sso's like gmail, facebook, twitter etc  will be added to routes sso 
app.use('/sso', sso);*/

/* mobile authentication end-point using id tokens */
app.use('/mobile', auth_mobile);

/* public certificates */
app.use('/oauth2', certificates);

/*
 *  * Add express error handler */
app.use(e_logger.errorLogger({
    showStack : true
}));

/*
 *  * catch 404 and forward to error handler
 *   */
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/*
 *  * error handler
 *   */
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	log.error ({ stack : err.stack, err : err }, 'caught error');

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
