var express    = require('express');
var controller = require('../controllers/profile');

var router  = express.Router();

/* Get user data by id */
router.get ('/:id', controller.profile);

/* Get multiple user data */
router.post ('/bulk', controller.bulk_profiles);

/* Get all users */
router.get ('/query/all', controller.all);

/* Get custom data */
router.post ('/custom/:id/:app', controller.custom);

/* Get multiple users custom data */
router.post ('/bulk_custom/:app', controller.bulk_custom);

module.exports = router;
