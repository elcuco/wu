'use strict'

var request = require("request");
var parseXmlString = require('xml2js').parseString;
var cheerio = require("cheerio");
var url = require('url');
var WhatsupCrawler = require("./WhatsupCrawler");

function parseHTML(rawHTML, nullifyIfEmpty=false) {
    var text = cheerio("<div>").html(rawHTML).text().trim();
    if (!nullifyIfEmpty) {
        return text;
    }
    return text.length == 0 ? null : text
}

function getArticleID(articleURL) {
    var url_parts = url.parse(articleURL, true);
    var query = url_parts.query;
    return query.sid;
}

function getForumID(articleURL) {
    var url_parts = url.parse(articleURL, true);
    var query = url_parts.query;
    return query.t;
}

function getArticles(baseURL, items, getItem) {
    var articles = [];
    for (var i in items) {
        var item = items[i];
        var article = {};
        article.title = parseHTML(item.title[0]);
        article.number = getItem(item.link[0]);
        article.date = parseHTML(item.pubDate[0]);
        article.category = null;
        article.summary = parseHTML(item.description[0]);
        articles.push(article)
    }
    return articles
}

// this is not a full implementation, as some parts will use 
// a crawler. The main page *IS* fetched from the RSS feed
class WhatsupRSS {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.crawler = new WhatsupCrawler(baseURL);
    }

    fetchBackendRSS(backend, getItem, callback) {
        var url = this.baseURL + backend;
        var options = {
            method: 'GET',
            url: url,
            encoding: 'utf-8' 
        };

        var vvv = this.baseURL;
        request(options, function(err, body) {
            if (err != null) {
                console.log(err); 
                callback(null, err);
                return;
            }
            parseXmlString(body.body, function (err, result) {
                var articles = getArticles(vvv, result.rss.channel[0].item, getItem);
                callback(articles, null);
            });
        });
    }

    fetchArticlesRSS(callback) {
        this.fetchBackendRSS("/backend.php?utf8=1", getArticleID, callback)
    }

    fetchTopicsRSS(callback) {
        this.fetchBackendRSS("/backend-forums.php?utf8=1", getForumID, callback)
    }

    fetchMainPage(callback) {
        var mainPage = {
            articles: null,
            forums: null 
        }

        var count = 0;
        this.fetchArticlesRSS(function (articles, err) {
        // this.fetchBackendRSS("/backend.php?utf8=1", getArticleID, function (articles, err) {
            count ++;
            if (err != null) {
                console.log("Failed fetching articles RSS")
                console.log(err);
                callback(null, err);
                return;
            }

            mainPage.articles = articles;
            if (count == 2) {
                callback(mainPage, null);
            } else {
                console.log("Read articles, waiting for topics to arrive")
            }
        });

        this.fetchTopicsRSS(function (topics, err){
        // this.fetchBackendRSS("/backend-forums.php?utf8=1", getForumID, function (topics, err) {
            count ++;
            if (err != null) {
                console.log(err); 
                callback(null, err);
                return;
            }
            mainPage.forums = topics;
            if (count == 2) {
                callback(mainPage, null);
            } else {
                console.log("Read topics, waiting for articles to arrive")
            }
        });
    }

    fetchArticle(articleID, callback) {
        this.crawler.fetchArticle(articleID, callback)
    }

    fetchForumTopic(topicID, callback) {
        this.crawler.fetchForumTopic(topicID, callback)
    }
}

module.exports = WhatsupRSS
