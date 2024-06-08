const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Create a new client instance
const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");
});

// When the client received QR-Code
client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});

// Function to send a message
function sendMessage({ contact, message }) {
  for (let index = 0; index < contact.length; index++) {
    client
      .sendMessage(contact[index], message)
      .then((response) => {
        console.log("Message sent successfully:", response);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  }
}

// Start your client
client.initialize();