import * as TelegramBot from "node-telegram-bot-api";
const TOKEN: string = process.env.TOKEN;
const PORT: number = parseInt(process.env.PORT) || 5000;
const NGROK_URL: string = process.env.NGROK_URL;

export const bot: TelegramBot = new TelegramBot(TOKEN, {
    webHook: {
        port: PORT,
    }
});

bot.setWebHook(`${NGROK_URL}/bot${TOKEN}`);
