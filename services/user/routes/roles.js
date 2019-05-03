var express = require('express');
var roles   = require('../controllers/roles');

var router  = express.Router();

/* Add new user */
router.post ('/create',      roles.create);
router.post ('/edit/:id',    roles.edit);
router.get  ('/profile/:id', roles.get);
router.get  ('/profiles',    roles.get_all);

module.exports = router;
