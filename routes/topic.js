var express = require('express');
var router = express.Router();

var whatsup = require("../WhatsupMemoryCached");
var client = new whatsup("https://whatsup.org.il")

/* GET users listing. */
router.get('/:id', function(req, res, next) {
    // res.send('Dislaying topic' + req.params.id);
    var topicID = req.params.id;
    client.fetchForumTopic(topicID, function(replies, error){
        res.render('topic', {
            posts: replies.posts
        });
    });
});

module.exports = router;