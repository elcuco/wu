'use strict'

var request = require("request");
var cheerio = require("cheerio");
var encoding = require("encoding");

function extractArticle(element) {
    let article = {
        title: "", info: ""
    };
    var e = cheerio(element)
    var a = e.find("a");
    article.title = a.text();
    article.number = a.attr("href").replace("print.php?sid=", "")
    article.info = e.find("span").text();
    return article;
}

class WhatsupCrawler {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    fetchMainPage(callback) {
        var url = this.baseURL + "/modules.php?op=modload&name=AvantGo&file=index";
        var options = {
            method: 'GET',
            url: url,
            encoding: 'binary' 
        };

        var mainPage = {
            articles: [],
            forums: []
        }
    
        request(options, function(err, body) {
            if (err != null) {
                console.log(err); 
                callback(null, err);
                return;
            }
            let utf8Body = encoding.convert(body.body, 'UTF8', 'CP1255').toString();
            let $ = cheerio.load(utf8Body);
            let lists = $("ul").toArray();
            cheerio(lists[0]).find("li").each(function(index, element) {
                mainPage.articles.push(extractArticle(element));
            });
            cheerio(lists[1]).find("li").each(function(index, element) {
                mainPage.forums.push(extractArticle(element));
            });
            callback(mainPage, null);
        });
    }
    
    // TODO 
    // - detect errors when passing wrong API numbers
    // - truely return Java text and not objects/nodes
    fetchArticle(articleID, callback) {
        var url = this.baseURL + "/modules.php?op=modload&name=News&file=article&sid=" + articleID;
        // console.log('GET: %s', url);
    
        var options = {
            method: 'GET',
            url: url,
            encoding: 'binary' 
        };
    
        request(options, function(err, body) {
            if (err != null) {
                console.log(err); 
                callback(null, err);
                return;
            }
            let utf8Body = encoding.convert(body.body, 'UTF8', 'CP1255').toString();
            let $ = cheerio.load(utf8Body);
            let articleHTML = $("div.ng_article");
            
            let article = {};

            // basic structure
            article.Content = articleHTML.find("span.pn-art").remove("a.pn-normal")
            article.Title = articleHTML.find("h1.ng_article_title a.pn-title").text()
            article.MetaData = articleHTML.find("div.ng_info_row").text().split("·")
            article.Date = article.MetaData[0]
            article.Author = article.MetaData[1]
            article.Topic = article.MetaData[2]
            article.Replies = []

            // add comments
            $("form table").each( function(i, element) {
                // each table is a new comment
                let rows = cheerio(element).find("tr td").toArray();
                let metaData = cheerio(rows[0]).find("font").toArray();
                
                let reply = {};
                reply.title = cheerio(metaData[0]).text();
                if (reply.title != null) {
                    // console.log(metaData);
                    reply.author = cheerio(metaData[2]).text();
                    reply.content = cheerio(rows[1]).html();
                    article.Replies.push(reply);
                }
            });

            // patch content to contain absolute paths
            article.Content.find("img").each(function(i, element){
                var origSrc = $(element).attr("src");
                if (!origSrc.startsWith("http")) {
                    $(element).attr("src", "https://whatsup.org.il/" + origSrc);
                }
            })
            
            article.Content.find("a").each(function(i, element){
                var origHref = $(element).attr("href");
                // console.log("a %d", origHref);
                if (origHref.startsWith("/")) {
                    $(element).attr("href", "https://whatsup.org.il" + origHref);
                }
            });
            
            callback(article, null);
        });
    }
};

module.exports = WhatsupCrawler;
