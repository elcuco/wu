var express = require('express');
var router = express.Router();

// var whatsup = require("../WhatsupCrawler");
var whatsup = require("../WhatsupMemoryCached");
var client = new whatsup("https://whatsup.org.il")

router.get('/index', function(req, res, next) {
  client.fetchMainPage(function(mainPage, error){
    if (error != null) {
      console.log(error)
      res.render("error")
      return;
    }
    res.json(mainPage);
  });
});

router.get('/articles', function(req, res, next) {
  client.fetchMainPage(function(mainPage, error){
    if (error != null) {
      console.log(error)
      res.json(null);
      return;
    }

    res.json(mainPage.articles);
  });
});

router.get('/article/:id', function(req, res, next) {
  var articleID = req.params.id;
  client.fetchArticle( articleID, function(article, error) {
    if (error != null) {
        console.log(error)
        res.json(null);
        return;
    }
    res.json(article);
  });
});

router.get("/forums", function(req, res, next) {
  client.fetchMainPage(function(mainPage, error){
    if (error != null) {
      console.log(error)
      res.json(null);
      return;
    }

    res.json(mainPage.forums);
  });
});

router.get("/forum/:id", function(req, res, next) {
  var articleID = req.params.id;
  client.fetchForumTopic(articleID, function(forumTopic, error) {
    if (error != null) {
        console.log(error)
        res.json(null);
        return;
    }
    res.json(forumTopic);
  });
});

module.exports = router;
