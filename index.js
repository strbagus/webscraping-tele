import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
dotenv.config();

const getData = async () => {
  const lPosts = JSON.parse(fs.readFileSync("db/post.json", "utf-8"));
  const data = await axios.get(process.env.link);
  const $ = cheerio.load(data.data);
  const posts = [];
  $("div.event-post").each((_, el) => {
    const postData = {};
    postData.title = $(el).find("h3").text();
    postData.link = $(el).find("a").attr("href");

    const news = lPosts.posts.find((pEl) => pEl.title == postData.title);

    !news && messages(`${postData.title} - ${postData.link}`) 

    posts.push(postData);
  });
  fs.writeFileSync(
    "db/post.json",
    JSON.stringify({
      posts: posts,
    }),
  );
};


const bot = new Telegraf(process.env.BToken);

bot.use(async (ctx, next) => {
  console.time(`Processing update ${ctx.update.update_id}`);
  await next();
  console.timeEnd(`Processing update ${ctx.update.update_id}`);
});

// COMMAND
bot.command("subscribe", async (ctx) => {
  const user = ctx.message.chat.id;
  const users = JSON.parse(fs.readFileSync("db/tUser.json", "utf8"));

  const exists = users.find((el) => el == user);
  if (!exists) {
    users.push(user);
    fs.writeFileSync("db/tUser.json", JSON.stringify(users));

    await ctx.reply("Anda akan mendapat informasi terbaru.");
  } else {
    await ctx.reply("Anda sudah berlangganan.");
  }
});

bot.command("unsubscribe", async (ctx) => {
  const user = ctx.message.chat.id;
  const users = JSON.parse(fs.readFileSync("db/tUser.json", "utf8"));

  const exists = users.find((el) => el == user);
  if (exists) {
    const removed = users.filter((el) => el != user);
    fs.writeFileSync("db/tUser.json", JSON.stringify(removed));

    await ctx.reply("Anda akan berhenti mendapat informasi terbaru.");
  } else {
    await ctx.reply("Anda belum berlangganan.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));


const messages = async (msg = 'default msg') => {
  const users = JSON.parse(fs.readFileSync("db/tUser.json", "utf8"));
  users.forEach(el => {
    bot.telegram.sendMessage(el, msg)
  });
}


setInterval(async () => {
  getData();
}, 900000)
