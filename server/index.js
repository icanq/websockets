import http from "http";
import handler from 'serve-handler';
import nanobuffer from 'nanobuffer';
import { generateAcceptValue, objToResponse, parseMessage } from "./utils/index.js";

let connections = [];
const msg = new nanobuffer(100);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "icanq",
  text: "test",
  time: Date.now()
})

const server = http.createServer((req, res) => {
  handler(req, res, {
    public: "./client"
  });
})

server.on("upgrade", function (req, socket, head) {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }
  const acceptKey = req.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);
  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-WebSocket-Accept: " + acceptValue,
    "Sec-WebSocket-Protocol: json",
    "\r\n",
  ]

  socket.write(headers.join("\r\n"));
  socket.write(objToResponse({ msg: getMsgs() }));

  connections.push(socket);

  socket.on("data", (buffer) => {
    const message = parseMessage(buffer);
    if (message) {
      console.log(message)
      msg.push({
        user: message.user,
        text: message.text,
        time: Date.now()
      })
      connections.forEach(socket => {
        socket.write(objToResponse({ msg: getMsgs() }));
      })
    } else if (message = null) {
      socket.end();
    }
    socket.on("end", () => {
      connections = connections.filter(socket => socket !== socket);
    })
  })
});

const port = process.env.port || 4000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});