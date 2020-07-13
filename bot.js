"use strict";
exports.__esModule = true;
exports.bot = void 0;
var TelegramBot = require("node-telegram-bot-api");
var TOKEN = process.env.TOKEN;
var PORT = parseInt(process.env.PORT) || 5000;
var NGROK_URL = process.env.NGROK_URL;
exports.bot = new TelegramBot(TOKEN, {
    webHook: {
        port: PORT
    }
});
exports.bot.setWebHook(NGROK_URL + "/bot" + TOKEN);
