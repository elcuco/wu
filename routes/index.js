var express = require('express');
var router = express.Router();

var WhatsupCrawler = require("../WhatsupCrawler");
var whatsupRSS = require("../WhatsupRSS");
var whatsup = require("../WhatsupMemoryCached");
var impl = new whatsupRSS("http://whatsup.org.il")
var client = new whatsup(impl)

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
