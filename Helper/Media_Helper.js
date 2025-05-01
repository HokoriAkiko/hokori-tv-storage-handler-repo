import path from "path";
import fs from "fs"
import { info_file_helper } from "../server.js";

class Media_Helper {
    #rootpath = path.resolve();
    #info_folder_path = path.join(this.#rootpath,"files","series");
    #thumbnail_folder_path = path.join(this.#info_folder_path,"thumbnail");

    constructor(){
        this.#folder_exist(this.#info_folder_path);
        this.#folder_exist(this.#thumbnail_folder_path);
    }

    #folder_exist(target){ if(!fs.existsSync(target)){fs.mkdirSync(target,{recursive: true})} }

    //save image to disk
    async add_image(image){
        if(!image) return {result: "Skipped"}

        const image_path = path.join(this.#thumbnail_folder_path,image.originalname);
        try{ await fs.promises.writeFile(image_path, image.buffer); }
        catch(e) {return {error: "Error saving image"} }

        return {result: image_path}
    }

    //save video to disk
    async add_video(file,folder_path){
        if(!file) return {result: "Skipped"}

        this.#folder_exist(folder_path);
        const video_path = path.join(folder_path, file.originalname);

        try{ await fs.promises.writeFile(video_path, file.buffer); }
        catch(e) {return {error: "Error saving video"} }

        return {result: video_path}
    }

    //gets array of residual thumbnails
    async get_residual_thumbnails(){
        const from_directory = await fs.promises.readdir(this.#thumbnail_folder_path).then((data)=>data.map((d)=>path.join(this.#thumbnail_folder_path,d)));
        const from_info_file = new Set(await info_file_helper.get_file_content().filter((v)=> !!v.thumbnail_path).map((v)=>v.thumbnail_path))
        return from_directory.filter((t)=> !from_info_file.has(t));
    }

    async delete_residuals(remove){
        if(remove.length === 0) return {result: "Skipped"};
        for await (const tp of remove){
            try{await fs.promises.unlink(tp);}
            catch(e){return {error: `${e}`};}
        }
        return {result: "Success"}
    }

    //gets array of residual videos
    async get_residual_videos(){
        const from_info_file = info_file_helper.get_file_content().map((v)=>{return {title:v.title,season:v.season,videos: v.videos ?? []}});
        let from_directory = [];
        let to_remove = [];

        for await (const info of from_info_file){
            try{
                const videos_in_folder = await fs.promises.readdir(path.join(this.#info_folder_path,info.title,`${info.season}`));
                from_directory.push({ title: info.title, season: info.season, videos: videos_in_folder });
            }
            catch(e){ from_directory.push({ title: info.title, season: info.season, videos: [] }); }
        }

        from_info_file.forEach((info)=>{
            from_directory.forEach((dir)=>{
                if(info.title === dir.title && info.season === dir.season){
                    const is = new Set(info.videos);
                    let tr = dir.videos.map((v)=>path.join(this.#info_folder_path,dir.title,`${dir.season}`,v)).filter((v)=>!is.has(v));
                    to_remove = [...to_remove, ...tr];
                }
            })
        })

        return to_remove;
    }
}

export default Media_Helper;