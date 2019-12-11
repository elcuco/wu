var express = require('express');
var router = express.Router();

var whatsup = require("../WhatsupMemoryCached");
var client = new whatsup("https://whatsup.org.il")

router.get('/:id', function(req, res, next) {
    var topicID = req.params.id;
    client.fetchForumTopic(topicID, function(replies, error) {
        console.log(replies)
        res.render('topic', {
            subject: replies.subject,
            posts: replies.posts
        });
    });
});

module.exports = router;