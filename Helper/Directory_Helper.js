import path from "path";
import fs from "fs"

class Directory_Helper {
    #seriespath = path.join(path.resolve(),"files","series");

    constructor(){}

    #folder_exist(folder){ if(!fs.existsSync(folder)){fs.mkdirSync(folder,{recursive: true})} }

    async rename_serie_folder(old_folder_name,new_folder_name){
        try{ this.#folder_exist(path.join(this.#seriespath,old_folder_name)); }
        catch(e){return {error: "Error in creating folder" + old_folder_name}}
        
        if(old_folder_name === new_folder_name) return {result: "Skipping"} //safe block

        try{ await fs.promises.rename(path.join(this.#seriespath,old_folder_name),path.join(this.#seriespath,new_folder_name)); }
        catch(e){return {error: `Error occured in renaming ${old_folder_name} to ${new_folder_name}`}}
        return {result: "Success"}
    }
}

export default Directory_Helper;