import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http"
const Bot = await import('./src/Bot.js');
const app = express();
dotenv.config();
const server = http.createServer(app);
app.use(express.json());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.get("/", (req, res) => {
    res.send("Express server");
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`server is running on  port ${PORT}`)
})