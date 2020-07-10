"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require('dotenv/config');
var mongodb = require("mongodb");
var express = require("express");
var TelegramBot = require("node-telegram-bot-api");
var Parser = require("rss-parser");
var Cron = require("cron");
var stopWord = require("stopword");
var TOKEN = process.env.TOKEN;
var NGROK_URL = process.env.NGROK_URL;
var PORT = parseInt(process.env.PORT) || 5000;
var paginationLimit = 20;
var URI = process.env.URI;
var MongoClient = mongodb.MongoClient;
var CronJob = Cron.CronJob;
var client = new MongoClient(URI);
var parser = new Parser();
var dbName = 'rss';
var app = express();
app.use(express.json());
var bot = new TelegramBot(TOKEN, {
    webHook: {
        port: PORT
    }
});
bot.setWebHook(NGROK_URL + "/bot" + TOKEN);
var CronJobExtended = /** @class */ (function () {
    function CronJobExtended(articles, users) {
        this.articles = articles;
        this.users = users;
        this.job = new CronJob({
            cronTime: '0 */5 * * * *',
            onTick: function () {
                return __awaiter(this, void 0, void 0, function () {
                    var feed, item, maxPublishingDate, filteredArticles, usersArray;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, parser.parseURL("https://news.ycombinator.com/rss")];
                            case 1:
                                feed = _a.sent();
                                return [4 /*yield*/, articles.find().toArray()];
                            case 2:
                                item = (_a.sent())
                                    .sort(function (a, b) { return (new Date(a.pubDate) > new Date(b.pubDate)) ? -1 : ((new Date(b.pubDate) > new Date(a.pubDate)) ? 1 : 0); })[0];
                                maxPublishingDate = item ? new Date(item.pubDate) : new Date(0);
                                filteredArticles = feed.items.filter(function (item) { return new Date(item.pubDate) > maxPublishingDate; });
                                filteredArticles.forEach(function (item) {
                                    item.keywords = stopWord.removeStopwords(item.title.split(' ')).join(' ');
                                });
                                if (!filteredArticles[0]) return [3 /*break*/, 4];
                                return [4 /*yield*/, articles.insertMany(filteredArticles)];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [4 /*yield*/, users.find().toArray()];
                            case 5:
                                usersArray = _a.sent();
                                usersArray.forEach(function (user) {
                                    filteredArticles.forEach(function (item) {
                                        bot.sendMessage(user.id, "New post is out! \n" + item.title + "\n" + item.link);
                                    });
                                });
                                return [2 /*return*/];
                        }
                    });
                });
            }
        });
    }
    CronJobExtended.prototype.start = function () {
        this.job.start();
    };
    return CronJobExtended;
}());
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, articles, users, job;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.connect()];
            case 1:
                _a.sent();
                db = client.db(dbName);
                articles = db.collection('articles');
                users = db.collection('users');
                job = new CronJobExtended(articles, users);
                job.start();
                app.get('/articles', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var query, results, page, filter, filterQuery, startIndex, _a, count;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                query = req.query;
                                results = {
                                    results: undefined
                                };
                                console.log(query);
                                page = query.page;
                                filter = query.filter || "";
                                filterQuery = {
                                    keywords: new RegExp(filter, 'i')
                                };
                                startIndex = (page - 1) * paginationLimit;
                                _a = results;
                                return [4 /*yield*/, articles.find(filterQuery).limit(paginationLimit).skip(startIndex).toArray()];
                            case 1:
                                _a.results = _b.sent();
                                count = 0;
                                results.results.forEach(function (_) {
                                    count++;
                                });
                                console.log(count);
                                return [4 /*yield*/, res.json(results)];
                            case 2:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                app.post("/bot" + TOKEN, function (req, res) {
                    bot.processUpdate(req.body);
                    res.sendStatus(200);
                });
                app.listen(PORT, function () { return console.log("Server started on " + PORT + " port"); });
                bot.onText(/\/start/, function (msg) {
                    users.findOne(msg.from).then(function (user) {
                        bot.sendMessage(user.id, "Hello " + user.first_name + ", welcome!");
                    })["catch"](function (user) {
                        users.insertOne(msg.from);
                        bot.sendMessage(user.id, "Hello " + user.first_name + ", welcome!");
                    });
                });
                return [2 /*return*/];
        }
    });
}); };
main()["catch"](function (err) { console.log(err); });
