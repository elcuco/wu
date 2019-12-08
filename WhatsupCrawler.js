'use strict'

var request = require("request");
var cheerio = require("cheerio");
var encoding = require("encoding");


function parseHTML(rawHTML, nullifyIfEmpty=false) {
    var text = cheerio("<div>").html(rawHTML).text().trim();
    if (!nullifyIfEmpty) {
        return text;
    }
    return text.length == 0 ? null : text
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

// https://stackoverflow.com/a/5631434
function stringUntil(s, delimiter) {
    var n = s.indexOf(delimiter)
    s = s.substring(0, n != -1 ? n : s.length);
    return s
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
    fetchArticle(articleID, callback) {
        var url = this.baseURL + "/modules.php?op=modload&name=News&file=article&sid=" + articleID;
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
                    $(element).attr("href", "https://whatsup.org.il/" + origHref);
                }
            });
            article.content = article.content.html()
            callback(article, null);
        });
    }

    fetchForumTopic(topicID, callback) {
        var url = this.baseURL + "/index.php?name=PNphpBB2&file=printview&t=" + topicID;
        var options = {
            method: 'GET',
            url: url,
            encoding: 'binary'
        }
        request(options, function(err, body) {
            if (err != null) {
                console.log("Error : " + err);
                callback(null, err);
                return;
            }
            let utf8Body = encoding.convert(body.body, 'UTF8', 'CP1255').toString();
            let $ = cheerio.load(utf8Body);

            let topicHTML = $("span.Topic");
            let posts = $("hr:not(.sep)").map((index,hr)=>{
                let content = $(hr).nextUntil('hr:not(.sep)').map((index,p)=>$.html(p)).get().join('');
                let author = cheerio(content).html();
                let postContent = cheerio(content).remove("<b:nth-child(1)>").html();
                return {
                    author: author,
                    // content: content,
                    postContent: postContent
                };
              }).get();

            var topic = { posts: [] };
            let sections = $("body").html().split("<hr>");
            topic.rawSections = sections;
            for (var index=1; index<sections.length-1; index++) {
                var section = sections[index];
                var parts = section.split("<hr class=\"sep\">");
                var metaParts = parts[0].split(" - ");

                var author = metaParts[0];
                var date = metaParts[1] + " " + stringUntil( metaParts[2], "<br>");
                var contentHTML = parts[1];
                var topicTitle = parts[0].split("<br>")[1].replace("&#x5E0;&#x5D5;&#x5E9;&#x5D0; &#x5D4;&#x5D4;&#x5D5;&#x5D3;&#x5E2;&#x5D4;: ","").trim();

                var i = topic.posts.push({title:"", author:"", date:"", content:""});
                topic.posts[i-1].title = parseHTML(topicTitle, true);
                topic.posts[i-1].author = parseHTML(author, true);
                topic.posts[i-1].date = date.trim();
                // topic.posts[i-1].content = parseHTML(contentHTML);
                topic.posts[i-1].content = contentHTML;
            };
            callback(topic, null);
        });
    }
};

module.exports = WhatsupCrawler;
