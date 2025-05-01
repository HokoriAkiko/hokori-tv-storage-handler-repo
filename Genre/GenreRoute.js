import { handle_update_genre , handle_get_genre } from "./GenreHandler.js"

const genre_routes = (app)=>{

    app.post("/update_genre",handle_update_genre);
    app.get("/get_genre",handle_get_genre);
}

export default genre_routes;