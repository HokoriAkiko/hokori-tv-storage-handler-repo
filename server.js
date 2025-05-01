import init_routes from "./RouteHandler.js";
import express from "express";
import cors from "cors";
import Info_File_Helper from "./Helper/Info_File_Helper.js";
import Genre_File_Helper from "./Helper/Genre_File_Helper.js"
import Media_Helper from "./Helper/Media_Helper.js";
import Token_Helper from "./Helper/Token_Helper.js";
import Serie_Helper from "./Helper/Serie_Helper.js";
import Directory_Helper from "./Helper/Directory_Helper.js";

const app = express();
const PORT = 5000;
// const ip = "192.168.1.9";
const origin = "*"

export const video_path_map = new Map();
export const token_helper = new Token_Helper();
export const info_file_helper = new Info_File_Helper();
export const genre_file_helper = new Genre_File_Helper();
export const media_helper = new Media_Helper();
export const serie_helper = new Serie_Helper();
export const directory_helper = new Directory_Helper();

app.use( cors( {origin} ) );
app.use(express.json());
app.use(express.urlencoded({extended : true}))

init_routes(app);

app.listen(5000,()=>{
    console.log("Storage Handler Started listening on PORT : ",PORT);
})
