require('app-module-path').addPath(__dirname + '/../../');
var express        = require('express');
var path           = require('path');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var lessMiddleware = require('less-middleware');
var e_logger       = require('express-bunyan-logger');
var store          = require('common/store');
var kv             = require('common/kv');
var log            = require('common/log');
var args           = require('apps/common/args');
var index          = require('apps/hello/routes/index');
var user           = require('apps/hello/routes/user');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

/*
 * Add express request logger */
app.use(e_logger({
	/* genReqId: function (req) { return req.req_id; }, */
	format: "HTTP :incoming :status-code :method :url :remote-address",
	excludes : [ 'req' , 'res', 'req-headers', 'res-headers', 'user-agent',
					'body', 'short-body', 'response-hrtime', 'http-version',
					'incoming', 'remote-address', 'method', 'url', 'status-code', 'ip'
	],
	includesFn : function (req, res) {
		if (res && res.statusCode >= 300 && res.statusCode < 400) {
			return {
				redirect_location : res._headers.location
			}
		}
		return {};
	},
	levelFn : function (status, err, meta) {
		if (status >= 400)
			return 'warn';
	},
	logger:log
}));

app.use('/', index);
app.use('/ping', (req, res, next) => { return res.send('pong');});
app.use('/user', user);

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
