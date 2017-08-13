var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('Dislaying topic' + req.params.id);
});

module.exports = router;