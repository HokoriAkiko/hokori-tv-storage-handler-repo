import path from "path";
import fs from "fs"
import { token_helper } from "../server.js";

class Info_File_Helper {
    #rootpath = path.resolve();
    #folderpath = path.join(this.#rootpath,"files","series");
    #filepath = path.join(this.#folderpath,"info.json");

    constructor() { this.#folder_exist(); this.#file_exist(); }

    #folder_exist(){ if(!fs.existsSync(this.#folderpath)){fs.mkdirSync(this.#folderpath,{recursive: true})} }

    #file_exist(){ if(!fs.existsSync(this.#filepath)){fs.writeFileSync(this.#filepath,JSON.stringify([]),"utf8")} }
    
    get_file_content(){ return JSON.parse(fs.readFileSync(this.#filepath,"utf8")); }

    write_in_file(obj) {
        try { fs.writeFileSync(this.#filepath,JSON.stringify(obj),"utf8"); return {result : "Success"}; }
        catch(e){ return {error: "Error writing info into file"}; }
    }

    update_record(obj,target_index){
        let from_file = this.get_file_content(); 
        from_file[target_index] = {...from_file[target_index] , ...obj};
        return this.write_in_file(from_file);
    }

    get_record(search,fields=[]){
        const {title,season,index} = search;
        let target = {};
        let to_return = {};

        if(index !== undefined && index !== null) target = this.get_file_content()[index];
        else target = this.get_file_content().find((info)=>info.title === title && info.season === parseInt(season));
        if(!!target){
            if(fields.length === 0) {to_return = target;}
            else { fields.forEach((key)=> to_return[key] = target[key])}
    
            if(!!fields.find((v)=> v === "videos")) to_return.videos = target?.videos?.map((p)=>token_helper.add_video(p)) || [];
            if(!!fields.find((v)=> v === "custom_names")) to_return.custom_names = target.custom_names || [];
        }

        return to_return
    }

    get_record_index(title,season) {return this.get_file_content().findIndex((v)=>v.title === title && v.season === parseInt(season));}

    //this filter will return a list of records that satisfies the filter
    //filter will contain the title or genres or both
    get_filtered_records(filter){
        const title = filter.title || "";
        const genres = filter.genres || [];
        const status = !!filter.status && !!filter.status.length ? filter.status : ["Ongoing","Finished"];

        const from_file = this.get_file_content();
        let result = [];

        const genre_match = (serie_genre_list)=>{
            if(genres.length === 0 || serie_genre_list.length === 0) return true;
            let found = false;
            genres.forEach((v)=>{serie_genre_list.forEach((vs)=>{if(vs === v){found = true;}})})
            return found;
        }

        const title_match = (serie_title)=>{
            const a1 = title.trim().toLowerCase().replace(/\s+/g, "");
            const a2 = serie_title.trim().toLowerCase().replace(/\s+/g, "");
            return (a1.includes(a2)|| a2.includes(a1));
        }

        for(let i=0;i<from_file.length;i++){
            const current = from_file[i];
            const obj = { title: current.title, season: current.season }
    
            if(title === "" && genres.length === 0){
                result.push(obj)
            }
            else if(title !== "" && genres.length === 0){
                if(title_match(current.title)){result.push(obj)}
            }
            else if(title === "" && genres.length !== 0){
                if(genre_match(current.genre_list)){result.push(obj)}
            }
            else{
                if(title_match(current.title) && genre_match(current.genre_list)){result.push(obj)}
            }
        }
        return result;
    }

    //add video file path to videos array
    add_video(info){
        const { title, season, custom_name, video_file_path } = info;

        let record = this.get_record({ title, season },[ "videos", "custom_names" ]);
        const record_index = this.get_record_index(title,season);
        
        record.videos = record.videos.map((t)=>token_helper.get_path_to_video(t));

        if(record.videos.findIndex((v)=>v === video_file_path) === -1 ){record.videos.push(video_file_path)}
        if(record.custom_names.findIndex((v)=> v === custom_name) === -1) {record.custom_names.push(custom_name)}

        return this.update_record(record,record_index);
    }
}

export default Info_File_Helper;