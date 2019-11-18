var express = require('express');
var router = express.Router();

// var whatsup = require("../WhatsupCrawler");
var whatsup = require("../WhatsupMemoryCached");
var client = new whatsup("https://whatsup.org.il")

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
