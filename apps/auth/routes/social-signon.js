var express       = require('express');
var router        = express.Router();
var log           = require('common/lib/log');
var social_google = require('auth/routes/social/google');

router.use('/google', social_google);

module.exports = router;
