var express = require('express');
var router = express.Router();

// var whatsup = require("../WhatsupCrawler");
// var whatsup = require("../WhatsupMemoryCached");
var whatsup = require("../WhatsupRSS");
var client = new whatsup("http://whatsup.org.il")

router.get('/', function(req, res, next) {
  client.fetchMainPage(function(mainPage, error){
    if (error != null) {
      console.log(error)
      res.render("error")
      return;
    }
    res.render('index', {
      articles: mainPage.articles,
      forums: mainPage.forums
    });
  });
});

module.exports = router;
