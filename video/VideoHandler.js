import path from "path";
import fs from "fs";
import mime from "mime-types";
import crypto from "crypto";
import {info_file_helper, token_helper, video_path_map} from "../server.js";

const folder_exist =(my_path)=> { if(!fs.existsSync(my_path)){fs.mkdirSync(my_path,{recursive: true})} }
const file_exist = (my_path)=> { if(!fs.existsSync(my_path)){fs.writeFileSync(my_path,JSON.stringify([]),"utf8")} }

const get_file_content = (my_path)=> JSON.parse(fs.readFileSync(my_path,"utf8"));

const write_in_file = (obj,my_path,message,res)=> {
    try{
        fs.writeFileSync(my_path,JSON.stringify(obj),"utf8");
        return res.send({result : message})
    }catch(e){
        return res.send({error: "Error writing info into file"})
    }
}

const make_token = ()=> crypto.randomBytes(16).toString("hex");

export const handle_get_video_custom_name = (req,res)=>{
    const {index,title,season} = req.body;

    const rootpath = path.resolve();
    const folderpath = path.join(rootpath,"files","series");
    const filepath = path.join(folderpath,"info.json");

    folder_exist(folderpath); file_exist(filepath);
    const from_file = get_file_content(filepath);

    for(let i=0;i<from_file.length;i++){
        if(from_file[i].title === title && from_file[i].season === season) return res.send({result: from_file[i].custom_names[index]})
    }
}

export const handle_get_stream_source = (req,res)=>{
    const {index,title,season,clip} = req.body;

    const rootpath = path.resolve();
    const folderpath = path.join(rootpath,"files","series");
    const filepath = path.join(folderpath,"info.json");

    folder_exist(folderpath); file_exist(filepath);
    const from_file = get_file_content(filepath);   

    for(let i=0;i<from_file.length;i++){
        if(from_file[i].title === title && from_file[i].season === season){
            const token = make_token(); video_path_map.set(token, from_file[i].videos[index]);
            if(clip) return res.send({result : `/stream_video/${token}/true`})
            return res.send({result : `/stream_video/${token}/false`})
        }
    }

    return res.send({error: "Stream Source Not Found."})
}

export const handle_stream_video = (req,res) =>{
    const location = token_helper.get_path_to_video(req.params.token);
    const clip = req.params.clip === "true";

    const size = fs.statSync(location).size;
    const content_type = mime.lookup(location) || "application/octet-stream";
    const CHUNK_SIZE = 10 **6; //10 lakh bytes means 1 mb or so

    if(clip){
        const start = 0;
        const end = 10 * CHUNK_SIZE;
        const content_length = end - start + 1;
        res.writeHead(206,{
            "Content-Range" : `bytes ${start}-${end}/${content_length}`,
            "Accept-Ranges" : "bytes",
            "Content-Length" : content_length,
            "Content-Type": content_type,
        });
        fs.createReadStream(location,{start,end}).pipe(res);
    }
    else{
        const range = req.headers.range || ""; if(!range) return res.status(416).send("Range Header Required");
    
        const start = Number(range.replace(/\D/g,""));
        const end = Math.min(start + CHUNK_SIZE,size - 1);
        const content_length = end - start + 1;
        
        if(start >= size || end >= size) return res.status(416).json({error: "Request Range Impossible"});
    
        res.writeHead(206,{
            "Content-Range" : `bytes ${start}-${end}/${size}`,
            "Accept-Ranges" : "bytes",
            "Content-Length" : content_length,
            "Content-Type": content_type,
        });
        fs.createReadStream(location,{start,end}).pipe(res);
    }
}

export const handle_update_video = (req,res)=>{
    const {title,season,old_videos} = req.body;
    if( old_videos.length === 0 ) return res.send({result: "Skipping",info: {title,season}});

    const target_index = info_file_helper.get_record_index(title,season);
    const target_record = info_file_helper.get_record({index: target_index},["videos","custom_names"]);

    const updates = {
        videos : old_videos.filter((obj)=>!obj.remove).map((obj)=>token_helper.get_path_to_video(target_record.videos[obj.index])),
        custom_names : old_videos.filter((obj)=>!obj.remove).map((obj)=>obj.new_name)
    }

    const update_operation = info_file_helper.update_record(updates,target_index);
    if(!!update_operation.error) return res.send({error : "Error in updating file"});

    res.send({result: "Success",info:{title,season}})
}