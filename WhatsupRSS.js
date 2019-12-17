'use strict'

var request = require("request");
var encoding = require("encoding");
var parseXmlString = require('xml2js').parseString;
var cheerio = require("cheerio");

function parseHTML(rawHTML, nullifyIfEmpty=false) {
    var text = cheerio("<div>").html(rawHTML).text().trim();
    if (!nullifyIfEmpty) {
        return text;
    }
    return text.length == 0 ? null : text
}

function getItem(baseURL, url) {
var remove = baseURL + "/modules.php?op=modload&name=News&file=article&rss=1&sid=";
    var id = url.replace(remove, "")
    console.log("->"  + url)
    console.log("* "  + baseURL)
    console.log("<-"  + remove)
    return id
}

function getArticles(baseURL, items) {
    var articles = [];
    for (var i in items) {
        var item = items[i];
        var article = {};
        article.title = parseHTML(item.title[0]);
        article.number = getItem(baseURL, item.link[0]);
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
    }

    fetchBackendRSS(backend, callback) {
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
            let utf8Body = body.body // encoding.convert(body.body, 'UTF8', 'CP1255').toString();
            parseXmlString(utf8Body, function (err, result) {
                var articles = getArticles(vvv, result.rss.channel[0].item);
                callback(articles, null);
            });
        });
    }

    fetchArticlesRSS(callback) {
        this.fetchBackendRSS("/backend.php?utf8=1", callback)
    }

    fetchTopicsRSS(callback) {
        this.fetchBackendRSS("/backend-forums.php?utf8=1", callback)
    }

    fetchMainPage(callback) {
        var mainPage = {
            articles: null,
            forums: null 
        }

        var count = 0;
        this.fetchArticlesRSS(function (articles, err) {
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
}

module.exports = WhatsupRSS
