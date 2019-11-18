var whatsupCrawler = require("./WhatsupCrawler");
var DefaultCacheTimeout = 1000 * 90; // 90 seconds of time cache

class WhatsupCached {
    constructor(baseURL) {
        this.cache = require('memory-cache');
        this.client = new whatsupCrawler(baseURL);
    }

    fetchMainPage(callback) {
        var mainPage = this.cache.get("main")
        if (mainPage != null) {
            console.log("Main page was found in cache - using it");
            callback(mainPage, null);
            return null;
        }

        console.log("Main page is not in cache - getting");
        var _cache = this.cache;
        this.client.fetchMainPage(function(mainPage, error) {
            _cache.put("main", mainPage, DefaultCacheTimeout );
            console.log("Main page stored in cache")
            callback(mainPage, null);
        });
    }

    fetchArticle(articleID, callback) {
        var article = this.cache.get("article/" + articleID)
        if (article != null) {
            console.log("Article " + articleID + "was found in cache - using it");
            callback(article, null);
            return null;
        }

        console.log("Main page is not in cache - getting");
        var _cache = this.cache;
        this.client.fetchArticle( articleID, function(article, error) {
            _cache.put("article/" + articleID, article, DefaultCacheTimeout );
            console.log("Article " + articleID + " stored in cache")
            callback(article, null);
        });
    }
};

module.exports = WhatsupCached;