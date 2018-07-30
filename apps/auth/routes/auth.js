var express   = require ('express');
var controller= require ('apps/auth/controllers/authorize'); 
var log       = require ('common/log');

var router = express.Router ();

router.get('/oauth2',
	controller.authorize,
	controller.decision,
	controller.errorhandler);

module.exports = router;
