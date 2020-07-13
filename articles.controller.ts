import * as express from 'express';
import * as mongodb from 'mongodb';
import {Article, User, SearchQuery} from './interfaces';
import {bot} from './bot'
const paginationLimit: number = 20;
const TOKEN: string = process.env.TOKEN;

class ArticlesController {
    public router: express.Router = express.Router();
    private articles: mongodb.Collection<Article>;
    private users: mongodb.Collection<User>

    constructor(articles: mongodb.Collection<Article>, users: mongodb.Collection<User>) {
        this.initializeRoutes();
        this.articles = articles;
        this.users = users;
    }

    public initializeRoutes() {
        this.router.get('/articles', this.getArticles);
        this.router.post(`/bot${TOKEN}`, this.postToBot);
    }

    getArticles = async (req: express.Request, res: express.Response) => {
        const query = req.query as SearchQuery;
        const results: {results: Article[]} = {
            results: undefined
        };
        const page: number = query.page;
        const filter: string = query.filter || ""
        const filterQuery: {keywords: RegExp} = {
            keywords: new RegExp(filter, 'i')
        }
        const startIndex: number = (page - 1) * paginationLimit;
        results.results = await this.articles.find(filterQuery).limit(paginationLimit).skip(startIndex).toArray();
        res.json(results);
    }

    postToBot = (req: express.Request, res: express.Response) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    };
}

export default ArticlesController;