var express       = require('express');
var log           = require('common/log');
var controller    = require('apps/auth/controllers/authorize');
var google_auth   = require('apps/auth/routes/social/google');
var facebook_auth = require('apps/auth/routes/social/facebook');
var router        = express.Router ();

/* google mobile backend endpoint */
router.use('/auth/google', google_auth);
router.use('/auth/facebook', facebook_auth);

module.exports = router;
