require('dotenv/config');
import * as mongodb from 'mongodb'
import * as TelegramBot from 'node-telegram-bot-api'
import * as Parser from 'rss-parser'
import * as Cron from 'cron'
import * as stopWord from 'stopword'
import {User,Article} from "./interfaces";
const PORT: number = parseInt(process.env.PORT) || 5000;
const URI: string = process.env.URI
const MongoClient = mongodb.MongoClient;
const CronJob = Cron.CronJob;
const client: mongodb.MongoClient = new MongoClient(URI);
const parser: Parser = new Parser();
const dbName: string = 'rss';
import {bot} from './bot'
import App from './app';
import ArticlesController from './articles.controller';


class CronJobExtended extends CronJob{
    private articles: mongodb.Collection<Article>;
    private users: mongodb.Collection<User>;

    constructor(articles: mongodb.Collection<Article>,users: mongodb.Collection<User>) {
        super('*/15 * * * * *',() => this.tick());
        this.articles = articles;
        this.users = users;
    }
    async tick(){
        const feed: Parser.Output = await parser.parseURL("https://news.ycombinator.com/rss")
        const item: Article = (await this.articles.find().sort({_id : -1}).limit(1).toArray())[0];
        const maxPublishingDate: Date = item ? new Date(item.pubDate) : new Date(0);
        const filteredArticles: Parser.Item[] = feed.items.filter(item => new Date(item.pubDate) > maxPublishingDate)
            .sort((a,b)=>(new Date(a.pubDate) > new Date(b.pubDate)? 1 : -1));
        filteredArticles.forEach(item=>{
            item.keywords = stopWord.removeStopwords(item.title.split(' ')).join(' ');
        })
        if(filteredArticles[0]) await this.articles.insertMany(filteredArticles);
        const usersArray: User[] = await this.users.find().toArray()
        usersArray.forEach(user=>{
            filteredArticles.forEach(item=>{
                bot.sendMessage(user.id,`New post is out! \n${item.title}\n${item.link}`)
            })
        })
    }

}

const main = async() => {
    await client.connect();
    const db: mongodb.Db = client.db(dbName);
    const articles: mongodb.Collection<Article> = db.collection('articles');
    const users: mongodb.Collection<User> = db.collection('users');
    const job: CronJobExtended = new CronJobExtended(articles,users);
    job.start();

    bot.onText(/\/start/, function (msg: TelegramBot.Message) : void {
        users.findOne(msg.from).then(user =>{
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        }).catch(user=>{
            users.insertOne(msg.from);
            bot.sendMessage(user.id,`Hello ${user.first_name}, welcome!`);
        });
    });

    const app: App = new App(
        [
            new ArticlesController(articles,users),
        ],
        PORT,
    );
    app.listen();
}

main().catch(err=>{console.log(err)});