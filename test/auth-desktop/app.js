require('app-module-path').addPath(__dirname + '/../../');
var express        = require('express');
var path           = require('path');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var lessMiddleware = require('less-middleware');
var e_logger       = require('express-bunyan-logger');
var store          = require('common/store');
var kv             = require('common/kv');
var passport       = require("passport");
var session        = require('express-session');
var redis          = require('connect-redis')(session);
var args           = require('apps/common/args');
var log            = require('common/log');
var jwt            = require('apps/auth/lib/token-verify/jwt');

var login = require('./routes/login');
var users = require('./routes/users');

var sess = {
	resave : true,
	saveUninitialized : true,
	secret : "mysecretkey",
	store : new redis ({ttl: 3600}),
	name : 'app.auth_desktop',
};

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	log.debug ({ user }, 'serialize user');
	done (null, user);
});
passport.deserializeUser(function (token, done) {
	log.debug ({ token }, 'de-serialize user');
	jwt.verify_signature (token, {},function (err, decoded) {
		if (err) {
			log.error ({ err }, 'error de-serializing user');
			return done (err, null);
		}
		log.debug ({ decoded }, 'decoded jwt');
		done(null, decoded);
	});
});

/*
 * Add express request logger */
app.use(e_logger({
	/* genReqId: function (req) { return req.req_id; }, */
	format: "HTTP :incoming :status-code :method :url :remote-address",
	excludes : [ 'req' , 'res', 'req-headers', 'res-headers', 'user-agent',
					'body', 'short-body', 'response-hrtime', 'http-version',
					'incoming', 'remote-address', 'method', 'url', 'status-code', 'ip'
	],
	levelFn : function (status, err, meta) {
		if (status >= 400)
			return 'warn';
	},
	logger:log
}));

app.use('/', login);
app.use('/users', users);

/*
 * Add express error handler */
app.use(e_logger.errorLogger({
	showStack : true
}));

/*
 * catch 404 and forward to error handler
 */
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/*
 * error handler
 */
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
