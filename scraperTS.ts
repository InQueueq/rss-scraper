require('dotenv/config')
import * as mongodb from 'mongodb'
import * as express from 'express'
import * as TelegramBot from 'node-telegram-bot-api'
import * as Parser from 'rss-parser'
import * as Cron from 'cron'
import * as stopWord from 'stopword'
const TOKEN: string = process.env.TOKEN;
const NGROK_URL: string = process.env.NGROK_URL;
const PORT: number = parseInt(process.env.PORT) || 5000;
const paginationLimit: number = 20;
const URI: string = process.env.URI
const MongoClient = mongodb.MongoClient;
const CronJob = Cron.CronJob;
const client: mongodb.MongoClient = new MongoClient(URI);
const parser: Parser = new Parser();
const dbName: string = 'rss';
const app = express();

app.use(express.json());
const bot = new TelegramBot(TOKEN, {
    webHook: {
        port: PORT,
    }
});

bot.setWebHook(`${NGROK_URL}/bot${TOKEN}`);

interface Article {
    title?: string,
    link?: string,
    pubDate?: string,
    comments?: string,
    content?: string,
    contentSnippet?: string,
    isoDate?: string,
    keywords?: string
}

interface User {
    id: number,
    is_bot: boolean,
    first_name: string,
    last_name?: string,
    username?: string,
    language_code?: string
}

type MyQuery = {
    page?: number,
    filter?: string
};

class CronJobExtended {
    private articles: mongodb.Collection<Article>;
    private users: mongodb.Collection<User>;
    private job: Cron.CronJob;
    constructor(articles: mongodb.Collection<Article>, users:mongodb.Collection<User>) {
        this.articles = articles;
        this.users = users;
        this.job = new CronJob({
            cronTime: '0 */5 * * * *',
            onTick: async function() {
                const feed: Parser.Output = await parser.parseURL("https://news.ycombinator.com/rss")
                const item: Article = (await articles.find().toArray())
                    .sort((a,b) => (new Date(a.pubDate) > new Date(b.pubDate)) ? -1 : ((new Date(b.pubDate) > new Date(a.pubDate)) ? 1 : 0))[0];
                const maxPublishingDate: Date = item ? new Date(item.pubDate) : new Date(0);
                const filteredArticles: Parser.Item[] = feed.items.filter(item => new Date(item.pubDate) > maxPublishingDate);
                filteredArticles.forEach(item=>{
                    item.keywords = stopWord.removeStopwords(item.title.split(' ')).join(' ');
                })
                if(filteredArticles[0]) await articles.insertMany(filteredArticles);
                const usersArray: User[] = await users.find().toArray()
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
    const db: mongodb.Db = client.db(dbName);
    const articles: mongodb.Collection<Article> = db.collection('articles');
    const users: mongodb.Collection<User> = db.collection('users');
    const job: CronJobExtended = new CronJobExtended(articles,users);
    job.start();

    app.get('/articles', async (req: express.Request, res: express.Response) => {
        const query = req.query as MyQuery;
        const results: {results: Article[]} = {
            results: undefined
        };
        console.log(query)
        const page: number = query.page;
        const filter: string = query.filter || ""
        const filterQuery: {keywords: RegExp} = {
            keywords: new RegExp(filter, 'i')
        }
        const startIndex: number = (page - 1) * paginationLimit;
        results.results = await articles.find(filterQuery).limit(paginationLimit).skip(startIndex).toArray();
        await res.json(results);
    })

    app.post(`/bot${TOKEN}`, (req: express.Request, res: express.Response) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    app.listen(PORT, ()=> console.log(`Server started on ${PORT} port`));

    bot.onText(/\/start/, function (msg: TelegramBot.Message) : void {
        users.findOne(msg.from).then(user =>{
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        }).catch(user=>{
            users.insertOne(msg.from);
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        });
    });
}

main().catch(err=>{console.log(err)});