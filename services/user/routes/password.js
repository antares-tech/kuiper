var express    = require('express');
var controller = require('../controllers/password');

var router  = express.Router();

/* Set user password */
router.post ('/create', controller.password);

/* Match password by id */
router.post ('/match', controller.match_password);

/* Match password by email */
router.post ('/match-email', controller.match_password_email);

/* Update password */
router.post ('/update', controller.update_password);

/* Reset Password */
router.post ('/reset/:id', controller.reset_password);

module.exports = router;
