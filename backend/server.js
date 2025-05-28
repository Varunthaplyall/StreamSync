import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import songRouter from "./routes/songs.js"
import spotifyTokenRouter from "./utils/spotify_token.js"

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/songs", songRouter);
app.use("/", spotifyTokenRouter);



app.listen(PORT,()=>{
    connectDB();
    console.log("server is running", PORT)
})