import path from "path";
import fs from "fs"
import mime from "mime-types"
import { info_file_helper, token_helper, media_helper,serie_helper, directory_helper } from "../server.js"

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

//step 1 of serie info upload , all of the important validations are performed in it
export const handle_serie_info_upload = async (req,res)=>{
    let {title,context,season,genre_list,status} = req.body;

    //step 1 is of validaion
    if(!!!title){return res.send({error: "Title missing"})}
    if(!!!season){return res.send({error: "Season missing"})}

    season = parseInt(season);

    //something is sent from front it can be a single varible or array
    if(!!genre_list){
        //if it is a single variable then create an array containing this single variable
        if(!Array.isArray(genre_list)){ genre_list = [genre_list]; }
    }
    else{genre_list = [];} // if it is undefined then create an empty array 

    const rootpath = path.resolve();
    const folderpath = path.join(rootpath,"files","series");
    const filepath = path.join(folderpath,"info.json");

    folder_exist(folderpath); file_exist(filepath);
    const from_file = get_file_content(filepath);

    //step 2 is duplicacy handling
    let title_index = -1;
    for(let i=0;i<from_file.length;i++) { if(from_file[i].title === title){title_index = i;break;} }

    if(title_index !== -1)
    {
        if(from_file[title_index].season === season) { return res.send({error: "Season already exist"}) }
        else { return write_in_file([...from_file,{title,context,season,genre_list,status}],filepath,"Serie Info Created",res); }
    }
    return write_in_file([...from_file,{title,context,season,genre_list,status}],filepath,"Serie Info Created",res);
}

//step 2 , this is the second step in serie upload , it only handles thumbnail file path and update it into info json file
export const handle_serie_thumbnail_upload = async (req,res)=>{
    const title = req.body.title;
    const season = parseInt(req.body.season);
    const {file} = req;

    const rootpath = path.resolve();
    const info_folder_path = path.join(rootpath,"files","series"); folder_exist(info_folder_path);
    const info_file_path = path.join(info_folder_path,"info.json"); file_exist(info_file_path);
    let info = get_file_content(info_file_path);

    if(!!file){
        const thumbnail_folder_path = path.join(info_folder_path,"thumbnail"); folder_exist(thumbnail_folder_path);
        const thumbnail_image_path = path.join(thumbnail_folder_path,file.originalname);

        try{ await fs.promises.writeFile(thumbnail_image_path, file.buffer); }
        catch(e) { return res.send({error: `${e}`}); }
        
        for(let i=0;i<info.length;i++) {
            if(info[i].title === title && info[i].season === season) info[i].thumbnail_path = thumbnail_image_path;
        }

        console.log("info file is: \n",info);
        return write_in_file(info,info_file_path,"Thumbnail Saved Successfully",res);
    }
    return res.send({result : "Thumbnail not found, skipped"});
}

//step 3 , this will upload and update info json by uploading only one video file
export const handle_serie_video_upload = async (req,res)=>{
    const { title, season } = req.body;
    const media_operation = await media_helper.add_video(req.file,serie_helper.prepare_folder_for_video(title,season));

    if(!!media_operation.error) return res.send({error: media_operation.error});
    if(!!media_operation.result){
        const file_operation = info_file_helper.add_video({ ...req.body, video_file_path : media_operation.result });
        if(!!file_operation.error) return res.send({error: "Error in updating serie info"})
    } 

    return res.send({result: "Success",info:{title,season: parseInt(season)}})
}

export const handle_get_series = (req,res)=>{
    res.send({result : info_file_helper.get_filtered_records(req.body)})
}

export const handle_get_series_count = (req,res)=>res.send({result : info_file_helper.get_file_content().length ?? 0});

export const handle_get_thumbnail = async (req,res)=>{
    const {thumbnail_path} = info_file_helper.get_record(req.body,["thumbnail_path"]);
    if(!!thumbnail_path) return res.send({result : `/stream_thumbnail/${token_helper.add_image(thumbnail_path)}`});
    return res.send({result: ""});
}
export const handle_stream_thumbnail = (req,res)=>{
    const image_path = token_helper.get_path_to_image(req.params.token);
    res.setHeader("Content-Type",mime.lookup(image_path))
    fs.createReadStream(image_path).pipe(res);
}

export const handle_get_serie_info = (req,res)=>{
    const {title,season,fields} = req.body;
    return res.send({result : info_file_helper.get_record({title,season},fields)});
}

export const handle_update_serie_info = async (req,res)=>{
    const { title, context, season, status, genre_list } = req.body;

    if(!title.new) return res.send({
        error: "New title must not be empty",
        info: {
            title: title.old,
            season: season.old,
        }
    });

    const old_info_index = info_file_helper.get_record_index(title.old,season.old);
    const new_info_index = info_file_helper.get_record_index(title.new,season.new);

    //new info index should be -1 or same as old , new title shouldnt be empty
    if(new_info_index === -1 || old_info_index === new_info_index){
        //renaming condition
        if(new_info_index === -1) {
            //step 1 : Prepare old, new title forlder path
            const title_rename_status = await directory_helper.rename_serie_folder(title.old,title.new);
            if(!!title_rename_status.error) return res.send({
                error: title_rename_status.error,
                info: {
                    title: title.old,
                    season: season.old,
                }
            });

            //step 2 : Prepare old, new seaosn folder path
            const season_rename_status = await directory_helper.rename_serie_folder(path.join(title.new,`${season.old}`),path.join(title.new,`${season.new}`));
            if(!!season_rename_status.error) return res.send({
                error: season_rename_status.error,
                info: {
                    title: title.old,
                    season: season.old,
                }
            });
        }

        const update_operation = info_file_helper.update_record({
            title: title.new,
            context: context.new,
            season: season.new,
            status: status.new,
            genre_list: genre_list.new
        }, old_info_index );

        if(update_operation.error) return res.send({
            error: update_operation.error,
            info: {
                title: title.old,
                season: season.old,
            }
        });

        return res.send({
            result: "Success",
            info: {
                title: title.new,
                season: season.new,
            }
        });
    }
    else{
        return res.send({error: `${title.new} Season ${season.new} already exist.`,
        info: {
            title: title.old,
            season: season.old,
        }});
    }
}

export const handle_update_thumbnail = async (req,res)=>{
    const { title, season } = req.body;
    const new_image = req.file; if(!new_image) return res.send({result: "Skipping",info:{ title, season: parseInt(season) }});

    const image_operation = await media_helper.add_image(new_image);
    if(!!image_operation.error) return res.send({error: image_operation.error});

    const target_index = info_file_helper.get_record_index(title,season);
    const update_operation = info_file_helper.update_record({thumbnail_path : image_operation.result},target_index);
    if(!!update_operation.error) return res.send({error: update_operation.error});

    return res.send({result : "Success",info:{ title, season: parseInt(season) }});
}

export const handle_get_residual_files_count = async (req,res) =>{
    const residual_videos = await media_helper.get_residual_videos();
    const residual_thumbnails = await media_helper.get_residual_thumbnails();

    res.send({result: residual_thumbnails.length + residual_videos.length});
}

export const handle_residual_files_deletion = async (req,res)=>{
    const residual_videos = await media_helper.get_residual_videos();
    const residual_thumbnails = await media_helper.get_residual_thumbnails();

    const delete_operation = await media_helper.delete_residuals([...residual_videos,...residual_thumbnails]);
    if(delete_operation.error) return res.send({error: "Error Deleting Files"});

    res.send({result: "Success"});
}

export const handle_get_missing_thumbnails_count = async (req,res)=>{
    res.send({result : info_file_helper.get_file_content().filter((v)=>!v.thumbnail).length ?? 0})
}