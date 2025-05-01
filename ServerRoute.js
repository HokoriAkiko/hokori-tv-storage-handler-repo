import { handle_server_health } from "./ServerHandler.js";

const server_routes = (app)=>{
    app.get("/get_server_health",handle_server_health);
}

export default server_routes;