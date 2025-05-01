import { 
    handle_get_video_custom_name, 
    handle_get_stream_source, 
    handle_stream_video,
    handle_update_video,

} from "./VideoHandler.js"

const video_routes = (app)=>{
    app.post("/get_video_custom_name",handle_get_video_custom_name);
    app.post("/get_stream_source",handle_get_stream_source);

    app.get("/stream_video/:token/:clip",handle_stream_video);

    app.post("/update_video",handle_update_video)
}

export default video_routes;