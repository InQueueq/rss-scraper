require('dotenv/config')
import * as mongodb from 'mongodb'
import * as express from 'express'
import * as TelegramBot from 'node-telegram-bot-api'
import * as Parser from 'rss-parser'
import * as Cron from 'cron'
import * as stopword from 'stopword'
const TOKEN: string = process.env.TOKEN
const NGROK_URL: string = process.env.NGROK_URL
const PORT = 5000 || process.env.PORT;
const paginationLimit = 20;
const URI: string = process.env.URI
const MongoClient = mongodb.MongoClient;
const CronJob = Cron.CronJob;
const client = new MongoClient(URI);
let parser = new Parser();
const dbName = 'rss';
const app = express();

app.use(express.json());
const bot = new TelegramBot(TOKEN, {
    webHook:{
        port: PORT,
    }
});

bot.setWebHook(`${NGROK_URL}/bot${TOKEN}`);

class CronJobExtended {
    private articles: any;
    private users: any;
    private job: any;
    constructor(articles:any, users:any) {
        this.articles = articles;
        this.users = users;
        this.job = new CronJob({
            cronTime: '0 */5 * * * *',
            onTick: async function() {
                const feed= await parser.parseURL("https://news.ycombinator.com/rss")
                const item = (await articles.find().toArray())
                    .sort((a,b)=>(new Date(a.pubDate) > new Date(b.pubDate)) ? -1 : ((new Date(b.pubDate) > new Date(a.pubDate)) ? 1 : 0))[0];
                const maxPublishingDate: Date = item ? new Date(item.pubDate) : new Date(0);
                const filteredArticles = feed.items.filter(item => new Date(item.pubDate) > maxPublishingDate);
                filteredArticles.forEach(item=>{
                    item.keywords = stopword.removeStopwords(item.title.split(' ')).join(' ');
                })
                if(filteredArticles[0]) articles.insertMany(filteredArticles);
                const usersArray = await users.find().toArray()
                usersArray.forEach(user=>{
                    filteredArticles.forEach(item=>{
                        bot.sendMessage(user.id,`New post is out! \n${item.title}\n${item.link}`)
                    })
                })
            }
        });
    }
    start(){
        this.job.start();
    }
}

const main = async() : Promise<void> => {
    await client.connect();
    const db = client.db(dbName);
    const articles = db.collection('articles');
    const users = db.collection('users');
    const job = new CronJobExtended(articles,users);
    job.start();

    app.get('/articles', async (req: express.Request, res: express.Response)=>{
        const results = {
            results: undefined
        };
        const page: number = parseInt(req.query.page) || 1;
        const filter: string = req.query.filter || ""
        const filterQuery = {
            keywords: new RegExp(filter, 'i')
        }
        const startIndex: number = (page - 1) * paginationLimit;
        results.results = await articles.find(filterQuery).limit(paginationLimit).skip(startIndex).toArray();
        await res.json(results);
    })

    app.post(`/bot${TOKEN}`, (req: express.Request, res: express.Response)  => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    app.listen(PORT, ()=> console.log(`Server started on ${PORT} port`));

    bot.onText(/\/start/, function (msg) : void {
        users.findOne(msg.from).then(user=>{
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        }).catch(user=>{
            users.insertOne(msg.from);
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        });
    });
}

main().catch(err=>{console.log(err)});