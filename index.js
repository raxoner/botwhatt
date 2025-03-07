const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const readline = require("readline-sync");
const axios = require("axios");
const cheerio = require("cheerio");
const ffmpeg = require("fluent-ffmpeg");

// Inisialisasi Client dengan Pairing Code
const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: { type: "remote" }
});

client.on("pairing", (code) => {
    console.log("=====[ PAIRING CODE ]=====");
    console.log(`Kode Pairing Anda: ${code}`);
    console.log("Gunakan kode ini untuk menghubungkan bot ke WhatsApp.");
});

client.on("ready", () => {
    console.log("✅ Bot WhatsApp siap digunakan!");
});

client.on("message", async (msg) => {
    const chat = await msg.getChat();
    const sender = msg.from;

    // Auto Responder
    if (msg.body.toLowerCase() === "halo") {
        msg.reply("Halo juga! Saya adalah bot WhatsApp.");
    }

    // Sticker Maker (Gambar → Stiker)
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        await client.sendMessage(sender, media, { sendMediaAsSticker: true });
    }

    // Teks ke Stiker (".stiker teks")
    if (msg.body.startsWith(".stiker ")) {
        const text = msg.body.replace(".stiker ", "");
        const textMedia = MessageMedia.fromFilePath("stiker.png"); // Ganti dengan teks ke gambar (buat sendiri)
        await client.sendMessage(sender, textMedia, { sendMediaAsSticker: true });
    }

    // Downloader YouTube & TikTok (Tanpa API)
    if (msg.body.startsWith(".yt ")) {
        const url = msg.body.split(" ")[1];
        const video = await axios.get(`https://yt1s.com/api/ajaxSearch/index?query=${url}`);
        const downloadUrl = video.data.links.mp4.auto.url;
        const media = await MessageMedia.fromUrl(downloadUrl);
        await client.sendMessage(sender, media, { caption: "🎥 Video YouTube Downloaded!" });
    }

    if (msg.body.startsWith(".tt ")) {
        const url = msg.body.split(" ")[1];
        const video = await axios.get(`https://ttsave.app/download?url=${url}`);
        const $ = cheerio.load(video.data);
        const downloadUrl = $("a.btn.btn-primary").attr("href");
        const media = await MessageMedia.fromUrl(downloadUrl);
        await client.sendMessage(sender, media, { caption: "🎥 Video TikTok Downloaded!" });
    }

    // Scraper Cuaca
    if (msg.body.startsWith(".cuaca ")) {
        const kota = msg.body.split(" ")[1];
        const weather = await axios.get(`https://wttr.in/${kota}?format=3`);
        msg.reply(`🌦 Cuaca di ${kota}: ${weather.data}`);
    }

    // Wikipedia Scraper
    if (msg.body.startsWith(".wiki ")) {
        const query = msg.body.replace(".wiki ", "");
        const wiki = await axios.get(`https://id.wikipedia.org/wiki/${query}`);
        const $ = cheerio.load(wiki.data);
        const summary = $("p").first().text();
        msg.reply(`📖 Wikipedia: ${summary}`);
    }

    // Admin Group Commands (Kick Member)
    if (msg.body.startsWith(".kick ")) {
        if (chat.isGroup) {
            const mentioned = msg.mentionedIds[0];
            if (mentioned) {
                await chat.removeParticipants([mentioned]);
                msg.reply("👤 Pengguna telah dikeluarkan!");
            } else {
                msg.reply("⚠ Harap mention pengguna yang ingin dikick.");
            }
        } else {
            msg.reply("⚠ Perintah hanya bisa digunakan di grup.");
        }
    }

    // Anti Link
    if (msg.body.includes("http")) {
        if (chat.isGroup) {
            msg.reply("🚫 Dilarang mengirim link di grup ini!");
        }
    }
});

client.initialize();
