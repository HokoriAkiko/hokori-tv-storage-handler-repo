import path from "path";
import fs from "fs";

class Genre_File_Helper {
    #rootpath = path.resolve();
    #folderpath = path.join(this.#rootpath,"files");
    #filepath = path.join(this.#folderpath,"genre.json");

    constructor() { this.#folder_exist(); this.#file_exist(); }

    #folder_exist(){ if(!fs.existsSync(this.#folderpath)){fs.mkdirSync(this.#folderpath,{recursive: true})} }

    #file_exist(){ if(!fs.existsSync(this.#filepath)){fs.writeFileSync(this.#filepath,JSON.stringify([]),"utf8")} }
    
    get_file_content(){ return JSON.parse(fs.readFileSync(this.#filepath,"utf8")); }

}

export default Genre_File_Helper;