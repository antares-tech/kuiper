var express = require('express');
var router  = express.Router();
var user    = require('apps/hello/controllers/user');

router.get('/ping', user.ping);
router.get('/version', user.get_version);

module.exports = router;
