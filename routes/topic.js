var express = require('express');
var router = express.Router();

var whatsupCrawler = require("../WhatsupCrawler");
var whatsupRSS = require("../WhatsupRSS");
var whatsup = require("../WhatsupMemoryCached");
var impl = new whatsupRSS("http://whatsup.org.il")
var client = new whatsup(impl)

router.get('/:id', function(req, res, next) {
    var topicID = req.params.id;
    client.fetchForumTopic(topicID, function(replies, error) {
        res.render('topic', {
            subject: replies.subject,
            posts: replies.posts
        });
    });
});

module.exports = router;