var express             = require('express');
var router              = express.Router();
var log                 = require('common/log');
var passport            = require('passport');
var controller          = require('apps/auth/controllers/mobile-auth/facebook');
var authorize_controller = require('apps/auth/controllers/authorize');

router.get('/',
	controller.__authenticate_facebook_id_token__,
	authorize_controller.authorize,
	authorize_controller.decision,
	authorize_controller.errorhandler
);

module.exports = router;
