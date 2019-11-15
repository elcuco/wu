'use strict'

var whatsup = require("../WhatsupCrawler");
var express = require('express');
var router = express.Router();
var client = new whatsup("https://whatsup.org.il")

router.get('/:id', function(req, res, next) {
    var articleID = req.params.id;
    client.fetchArticle( articleID, function(article, error) {
        console.log(error)
        if (error != null) {
            console.log("FAIL - error")
            res.render("error")
            return;
        }

        res.render('article', {
            title: article.Title,
            date: article.Date,
            author: article.Author,
            content: article.Content.html(),
            comments: article.Replies
        });
    });
});

module.exports = router;
