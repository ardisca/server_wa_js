import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Client } from "whatsapp-web.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

let isLogin = false;

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");

  client.on("qr", (qr) => {
    if (isLogin != true) {
      console.log("QR RECEIVED", qr);
      socket.emit("qr", qr);
    }
  });
  // When the client is ready, run this code (only once)
  client.once("ready", async () => {
    const { pushname, wid } = client.info;
    const name = pushname || "Pengguna"; // Use the pushname if available
    const phone = wid.user; // Extract phone number from ID
    console.log(`Client is ready! Name: ${name}, Phone: ${phone}`);
    socket.emit("isLogin", { name, phone }); // Notify the client that WhatsApp client is ready
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("chat message", ({ message, number }) => {
    console.log("Terima Server");
    console.log("messages: " + message);
    console.log("numbers: " + number);

    socket.emit("chat message", { message, number });
    sendMessage({ contact: number, message, socket });
    console.log("Keluar Server");
  });
});

client.initialize();

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

function sendMessage({ contact, message, socket }) {
  for (let index = 0; index < contact.length; index++) {
    client
      .sendMessage(contact[index], message)
      .then((response) => {
        socket.emit("send status");
        console.log("Message sent successfully:", response.isStatus);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  }
}
