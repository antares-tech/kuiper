var express   = require ('express');
var log       = require ('common/log');
var register  = require ('../controllers/register'); 

var router = express.Router ();

/* initial access token validation middleware
router.use(validate token);*/

router.post('/add', register.entry);

module.exports = router;
