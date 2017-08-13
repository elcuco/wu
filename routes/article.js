var express = require('express');
var request = require("request");
var cheerio = require("cheerio");
var encoding = require("encoding");
var router = express.Router();

/* GET users listing. */
router.get('/:id', function(req, res, next) {
    var articleID = req.params.id
    var url = "https://whatsup.org.il/modules.php?op=modload&name=News&file=article&sid=" + articleID;
    console.log('GET: %s', url);

    var options = {
        method: 'GET',
        url: url,
        encoding: 'binary' 
    };

    request(options, function(err, body) {
        console.log(err); // Print out the HTML
        let utf8Body = encoding.convert(body.body, 'UTF8', 'CP1255').toString();
        let $ = cheerio.load(utf8Body);

        let articleHTML = $("div.ng_article");
        let articleTitle = articleHTML.find("h1.ng_article_title a.pn-title").text()
        let articleMetaData = articleHTML.find("div.ng_info_row").text().split("·")
        let articleDate = articleMetaData[0]
        let articleAuthor = articleMetaData[1]
        let articleTopic = articleMetaData[2]
        var articleContent = articleHTML.find("span.pn-art").remove("a.pn-normal")

        articleContent.find("img").each(function(i, element){
            var origSrc = $(element).attr("src");
            if (origSrc.startsWith("/")) {
                $(element).attr("src", "https://whatsup.org.il" + origSrc);                
            }
        })

        articleContent.find("a").each(function(i, element){
            var origHref = $(element).attr("href");
            // console.log("a %d", origHref);
            if (origHref.startsWith("/")) {
                $(element).attr("href", "https://whatsup.org.il" + origHref);
            }
        })

        res.render('article', {
            title: articleTitle,
            date: articleDate,
            author: articleAuthor,
            content: articleContent.html()
        });
    });
});

module.exports = router;