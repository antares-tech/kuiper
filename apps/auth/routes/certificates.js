var express         = require ('express');
var log             = require ('common/log');
var controller      = require ('apps/auth/controllers/certificates');

var router = express.Router ();

router.get('/v1/certs', controller.get_certificates);

module.exports = router;
