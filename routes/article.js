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

    request(url, function(err, body) {
        console.log(err || body.body); // Print out the HTML

        /*
        <div class="ng_article">
        <h1 class="ng_article_title">
            <a title="Short URL" href="/article/7280">
                <img style="border:0; vertical-align:bottom;" alt="quick_link" src="/images/whatsup/cat_folder_big.gif">
            </a>
            <a class="pn-title" href="modules.php?op=modload&amp;name=News&amp;file=article&amp;sid=7280&amp;mode=nested&amp;order=0&amp;thold=0">
            נפתח ה-CFP לאוגוסט פינגווין הקרוב
            </a>
        </h1>

        <span class="pn-art">
            <a class="pn-normal" href="modules.php?op=modload&amp;name=News&amp;file=index&amp;catid=&amp;topic=20">
                <img src="images/topics/announce.png" border="0" Alt="הכרזות" align="right" hspace="5" vspace="5" >
            </a>
            ה-CFP, קול קורא להרצאות, לקראת <a href="http://ap.hamakor.org.il/2017/">אוגוסט פינגווין הקרוב</a> פתוח, אתם מוזמנים להגיש את הרצאותיכם לכנס שיתקיים ב-7-8 לספטמבר במכללת שנקר ברמת גן.<br><br>
            השנה הכנס ייערך במתכונת של יומיים ומגוון מסלולים, אם ברצונכם להרצות בהם, השתמשו ב<a href="https://docs.google.com/forms/d/e/1FAIpQLSc4x2XDQ36LoqeQMzk6p9qrZ25xFtOC9YWIE3KZQ0faGfxxjg/viewform">טופס להגשת הצעה להרצאה</a>.<br><br>
            תודה,<br>
            משה, בשם צוות המארגנים<BR><BR>
        </span>
        */

        let utf8Body = body.body; // encoding.convert(body.body, "CP1255", 'UTF8').toString();
        let $ = cheerio.load(utf8Body);
        let articleTitle = $("div.ng_article h1.ng_article_title a.pn-title").text()
        let articleContent = $("span.pn-art").text()

        res.render('article', {
            title: articleTitle,
            content: articleContent
        });
    });
});

module.exports = router;