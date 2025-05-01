import multer from "multer";
import { 
    handle_serie_info_upload,
    handle_serie_thumbnail_upload, 
    handle_serie_video_upload,
    handle_get_series,
    handle_get_series_count,
    handle_get_thumbnail,

    handle_get_serie_info,
    handle_update_serie_info,
    handle_update_thumbnail,
    handle_stream_thumbnail,

    handle_get_residual_files_count,
    handle_residual_files_deletion,

    handle_get_missing_thumbnails_count
} from "./SerieHandler.js"

const storage = multer.memoryStorage();
const video_multer = multer({storage : storage});
const thumbnail_multer = multer({storage : storage});
const simple_multer = multer();

const serie_routes = (app)=>{
    app.post("/upload_serie_info",simple_multer.none(),handle_serie_info_upload);
    app.post("/upload_thumbnail",thumbnail_multer.single("thumbnail"),handle_serie_thumbnail_upload);
    app.post("/upload_video",video_multer.single("video"),handle_serie_video_upload);
    
    app.post("/get_series",handle_get_series);
    app.get("/get_series_count",handle_get_series_count);

    app.post("/get_thumbnail",handle_get_thumbnail);
    app.get("/stream_thumbnail/:token",handle_stream_thumbnail);

    app.post("/update_serie_info",simple_multer.none(),handle_update_serie_info);
    app.post("/update_thumbnail",thumbnail_multer.single("thumbnail"),handle_update_thumbnail);
    app.post("/get_serie_info",simple_multer.none(),handle_get_serie_info);

    app.get("/residual_files",handle_get_residual_files_count);
    app.delete("/residual_files",handle_residual_files_deletion);

    app.get("/missing_thumbnails",handle_get_missing_thumbnails_count);
}

export default serie_routes;