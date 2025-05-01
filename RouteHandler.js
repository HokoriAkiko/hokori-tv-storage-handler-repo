import genre_routes from "./Genre/GenreRoute.js";
import serie_routes from "./Serie/SerieRoute.js";
import video_routes from "./video/VideoRoute.js";
import server_routes from "./ServerRoute.js";

const init_routes = (app) =>{
    server_routes(app);
    genre_routes(app);
    serie_routes(app);
    video_routes(app);
}

export default init_routes;