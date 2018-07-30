var express         = require ('express');
var log             = require ('common/log');
var controller      = require ('apps/auth/controllers/token');

var router = express.Router ();

router.post('/oauth2',
	controller.__authenticate_client__,
	controller.token,
	controller.errorhandler
);

module.exports = router;
