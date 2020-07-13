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
var express = require("express");
var bot_1 = require("./bot");
var paginationLimit = 20;
var TOKEN = process.env.TOKEN;
var ArticlesController = /** @class */ (function () {
    function ArticlesController(articles, users) {
        var _this = this;
        this.router = express.Router();
        this.getArticles = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var query, results, page, filter, filterQuery, startIndex, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = req.query;
                        results = {
                            results: undefined
                        };
                        page = query.page;
                        filter = query.filter || "";
                        filterQuery = {
                            keywords: new RegExp(filter, 'i')
                        };
                        startIndex = (page - 1) * paginationLimit;
                        _a = results;
                        return [4 /*yield*/, this.articles.find(filterQuery).limit(paginationLimit).skip(startIndex).toArray()];
                    case 1:
                        _a.results = _b.sent();
                        res.json(results);
                        return [2 /*return*/];
                }
            });
        }); };
        this.postToBot = function (req, res) {
            bot_1.bot.processUpdate(req.body);
            res.sendStatus(200);
        };
        this.initializeRoutes();
        this.articles = articles;
        this.users = users;
    }
    ArticlesController.prototype.initializeRoutes = function () {
        this.router.get('/articles', this.getArticles);
        this.router.post("/bot" + TOKEN, this.postToBot);
    };
    return ArticlesController;
}());
exports["default"] = ArticlesController;
