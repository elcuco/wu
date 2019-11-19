'use strict'

var request = require("request");
var cheerio = require("cheerio");
var encoding = require("encoding");


function parseHTML(rawHTML) {
    return cheerio("<div>").html(rawHTML).text().trim();
}

function extractItem(element) {
    let article = {};
    var e = cheerio(element);
    var a = e.find("a");
    var t = e.find("span").html();
    var i = t.split("|")[1].split("<br>");
    article.title = a.text();
    article.number = a.attr("href");
    article.date = i[1];
    article.category = parseHTML(i[0]);
    return article;
}

function extractForum(element) {
    var item = extractItem(element);
    var s = cheerio(element).find("span").html().split("|");
    var t = s[2].split("<br>");
    item.number = item.number.replace("index.php?name=PNphpBB2&file=printview&t=", "")
    item.category =  parseHTML(s[1]);
    item.responseCount = parseHTML(t[0]);
    item.date = parseHTML(t[1]);
    return item;
}

function extractArticle(element) {
    var item = extractItem(element);
    item.number = item.number.replace("print.php?sid=", "")
    return item;
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
                mainPage.forums.push(extractForum(element));
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

            if (articleHTML.text().length == 0) {
                console.log("Could not parse original site");
                callback(null, err);
                return;
            }

            let article = {};
            let metaData = articleHTML.find("div.ng_info_row").text().trim().split("·")

            // basic structure
            article.content = articleHTML.find("span.pn-art").remove("a.pn-normal");
            article.title = articleHTML.find("h1.ng_article_title a.pn-title").text();
            article.date = metaData[0].trim();
            article.author = metaData[1].trim();
            article.topic = metaData[2].trim();
            article.replies = [];

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
                    article.replies.push(reply);
                }
            });

            // patch content to contain absolute paths
            article.content.find("img").each(function(i, element){
                var origSrc = $(element).attr("src");
                if (!origSrc.startsWith("http")) {
                    $(element).attr("src", "https://whatsup.org.il/" + origSrc);
                }
            })
            
            article.content.find("a").each(function(i, element){
                var origHref = $(element).attr("href");
                // console.log("a %d", origHref);
                if (origHref.startsWith("/")) {
                    $(element).attr("href", "https://whatsup.org.il" + origHref);
                }
            });
            article.content = article.content.html()
            callback(article, null);
        });
    }
};

module.exports = WhatsupCrawler;
