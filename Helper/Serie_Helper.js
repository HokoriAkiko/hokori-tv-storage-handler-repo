import path from "path";
import fs from "fs"

class Serie_Helper {
    #rootpath = path.resolve();
    #serie_folder_path = path.join(this.#rootpath,"files","series");

    #folder_exist(){ if(!fs.existsSync(this.#serie_folder_path)){fs.mkdirSync(this.#serie_folder_path,{recursive: true})} }

    //path to save video file
    prepare_folder_for_video(title,season){
        const title_path = path.join(this.#serie_folder_path,title);
        this.#folder_exist(title_path);

        const season_path = path.join(title_path,season);
        this.#folder_exist(season_path);

        return season_path;
    }
}

export default Serie_Helper;