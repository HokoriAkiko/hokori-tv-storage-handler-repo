import { genre_file_helper } from "../server.js";

import path from "path";
import fs from "fs";

const rootpath = path.resolve();
const folderpath = path.join(rootpath,"files");
const filepath = path.join(folderpath,"genre.json");

//if folder not found then create it
const folder_exist = ()=> {if(!fs.existsSync(folderpath)) fs.mkdirSync(folderpath,{recursive: true}); }

//if file not found then create it 
const file_exist = ()=>{ if(!fs.existsSync(filepath)) fs.writeFileSync(filepath,JSON.stringify([]),"utf8"); }

//read content of the file
const get_file_content = ()=> fs.readFileSync(filepath,"utf8");

//update the content of file basically rewrite it all
const update_file_content = (content) => fs.writeFileSync(filepath,JSON.stringify(content),"utf8")


export const handle_update_genre = async (req,res)=>{
    folder_exist();
    file_exist();

    update_file_content(req.body);
    res.send({result: get_file_content()})
}

export const handle_get_genre = async (_,res)=>{
    res.send({result: genre_file_helper.get_file_content()});
}