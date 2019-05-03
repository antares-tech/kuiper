var revision  = require ('./git-revision');
var req_track = require ('./request-tracker');
var consul    = require ('./consul');
var uptime    = require ('./uptime');
var log_ctrl  = require ('./log-control');

var routes = {};

routes.add_default = function (app) {
	app.use  (req_track.count_in);
	app.use  (req_track.count_out);
	app.get  ('/common/revision',                 revision.get);
	app.get  ('/common/uptime',                   uptime.get);
	app.get  ('/common/log/level',                log_ctrl.get_level);
	app.post ('/common/log/level/:stream/:level', log_ctrl.set_level);
	app.post ('/common/log/level/:stream/:level/:module', log_ctrl.set_level);
};

module.exports = routes;
