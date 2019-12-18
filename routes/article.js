'use strict'

var express = require('express');
var router = express.Router();

var whatsupCrawler = require("../WhatsupCrawler");
var whatsupRSS = require("../WhatsupRSS");
var whatsup = require("../WhatsupMemoryCached");
var impl = new whatsupRSS("http://whatsup.org.il")
var client = new whatsup(impl)

router.get('/:id', function(req, res, next) {
    var articleID = req.params.id;
    client.fetchArticle( articleID, function(article, error) {
        if (error != null) {
            console.log(error)
            res.render("error")
            return;
        }

        res.render('article', {
            title: article.title,
            date: article.date,
            author: article.author,
            content: article.content,
            comments: article.replies
        });
    });
});

module.exports = router;
