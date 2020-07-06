require('dotenv/config')
const TOKEN = process.env.TOKEN
const URL = process.env.URL
const URI = process.env.URI
const MongoClient = require('mongodb').MongoClient;
const dbName = 'rss';
const Parser = require("rss-parser");
const parser = new Parser();
const CronJob = require('cron').CronJob;
const stopword = require('stopword')
const express = require('express')
const app = express()
const PORT = 5000 || process.env.PORT;
const paginationLimit = 20;
const TelegramBot = require('node-telegram-bot-api');
const client = new MongoClient(URI);

const bot = new TelegramBot(TOKEN, {
    webHook:{
        port: PORT,
    }
});

bot.setWebHook(`${URL}/bot${TOKEN}`);

app.use(express.json());

const job = new CronJob({
    cronTime: '0 */5 * * * *',
    onTick: async function() {
        const feed = await parser.parseURL("https://news.ycombinator.com/rss")
        const item = (await this.articles.find().sort({pubDate:-1}).limit(1).toArray())[0];
        const maxPublishingDate = item ? item.pubDate : new Date(0);
        const filteredArticles = feed.items.filter(item=>new Date(item.pubDate) > maxPublishingDate);
        filteredArticles.forEach(item=>{
            item.keywords = stopword.removeStopwords(item.title.split(' ')).join(' ');
            item.pubDate = new Date(item.pubDate);
        })
        if(filteredArticles[0]) this.articles.insertMany(filteredArticles);
        const users = await this.users.find().toArray()
        users.forEach(user=>{
            filteredArticles.forEach(item=>{
                bot.sendMessage(user.id,`New post is out! \n${item.title}\n${item.link}`)
            })
        })
    }
});

const main = async() => {
    await client.connect();
    const db = client.db(dbName);
    const articles = db.collection('articles');
    const users = db.collection('users');
    job.articles = articles
    job.users = users;
    job.start();

    app.get('/articles', async (req, res)=>{
        const results = {};
        const page = parseInt(req.query.page) || 1;
        const filter = req.query.filter || ""
        const filterQuery = {
            keywords: new RegExp(filter, 'i')
        }
        const startIndex = (page - 1) * paginationLimit;
        results.results = await articles.find(filterQuery).limit(paginationLimit).skip(startIndex).toArray();
        res.json(results);
    })

    app.post(`/bot${TOKEN}`, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    app.listen(PORT, ()=> console.log(`Server started on ${PORT} port`));

    bot.onText(/\/start/, function (msg) {
        users.findOne(msg.from).then(user=>{
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        }).catch(user=>{
            users.insertOne(msg.from);
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        });
    });

}

main().catch(err=>{console.log(err)});
