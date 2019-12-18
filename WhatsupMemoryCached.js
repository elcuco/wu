var DefaultCacheTimeout = 1000 * 90; // 90 seconds of time cache

class WhatsupMemoryCached {
    constructor(whastUpImpl) {
        this.cache = require('memory-cache');
        this.client = whastUpImpl;
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
            console.log("Article " + articleID + " was found in cache - using it");
            callback(article, null);
            return null;
        }

        console.log("Article " + articleID  +" is not in cache - getting");
        var _cache = this.cache;
        this.client.fetchArticle( articleID, function(article, error) {
            _cache.put("article/" + articleID, article, DefaultCacheTimeout );
            console.log("Article " + articleID + " stored in cache")
            callback(article, null);
        });
    }

    fetchForumTopic(topicID, callback) {
        var topic = this.cache.get("forum/" + topicID)
        if (topic != null) {
            console.log("Forum topic " + topicID + " was found in cache - using it");
            callback(topic, null);
            return null;
        }

        console.log("Forum topic " + topicID  +" is not in cache - getting");
        var _cache = this.cache;
        this.client.fetchForumTopic( topicID, function(topic, error) {
            _cache.put("forum/" + topicID, topic, DefaultCacheTimeout );
            console.log("Forum topic " + topicID + " stored in cache")
            callback(topic, null);
        });
    }
};

module.exports = WhatsupMemoryCached;