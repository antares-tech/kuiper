var express    = require('express');
var controller = require('../controllers/admin');

var router  = express.Router();

/* Add new user */
router.post ('/add', controller.add);

/* Edit user */
router.post ('/edit/:id', controller.edit);

/* Add custom data */
router.post ('/custom/:id/:app', controller.custom);

/* Update profile 
router.post ('/update', controller.update_profile);
*/

module.exports = router;
