import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "whatsapp-web.js";
const { Client, MessageMedia, LocalAuth } = pkg;
// import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

let isLogin = false;

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// app.use(bodyParser.json({ limit: "50mb" }));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    //C:\Program Files\Google\Chrome\Application
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  },
  // webVersionCache: {
  //   type: "remote",
  //   remotePath:
  //     "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  // },
});

io.on("connection", (socket) => {
  console.log("a user connected");

  client.on("qr", (qr) => {
    if (isLogin != true) {
      console.log("QR RECEIVED", qr);
      socket.emit("qr", qr);
    }
  });
  client.once("ready", async () => {
    const { pushname, wid } = client.info;
    const name = pushname || "Pengguna";
    const phone = wid.user;
    console.log(`Client is ready! Name: ${name}, Phone: ${phone}`);
    socket.emit("isLogin", { name, phone });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("chat message", ({ message, number, file }) => {
    console.log("Terima Server");
    console.log("messages: " + message);
    console.log("numbers: " + number);
    console.log("file: " + file);

    sendMessage({ contact: number, message, socket, file });
    socket.emit("chat message", { message, number });
    console.log("Keluar Server");
  });
});

client.initialize();

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

async function sendMessage({ contact, message, socket, file }) {
  let media;
  if (file) {
    const [prefix, base64File] = file.split(",");
    const mimeType = prefix.match(/:(.*?);/)[1];

    media = new MessageMedia(mimeType, base64File);
    console.log(file);
    console.log(media);
  }

  for (let index = 0; index < contact.length; index++) {
    try {
      if (media) {
        await client.sendMessage(contact[index], media, { caption: message });
      } else {
        await client.sendMessage(contact[index], message);
      }
      socket.emit("send status");
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}
