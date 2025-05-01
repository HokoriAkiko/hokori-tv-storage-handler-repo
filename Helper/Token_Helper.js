import crypto from "crypto";

class Token_Helper {
    #video_map;
    #image_map;
    constructor() {
        this.#video_map = {};
        this.#image_map = {};
    }

    #make_token(){
        const token = crypto.randomBytes(16).toString("hex");
        return !!this.#video_map[token] || !!this.#image_map[token] ? this.#make_token() : token;
    }

    get_path_to_video(token) { return this.#video_map[token]; }
    get_path_to_image(token) { return this.#image_map[token]; }

    //add a video file path into map and return token as key
    add_video(path){
        const token = this.#make_token();
        this.#video_map[token] = path;
        return token;
    }

    //add an image file path into map and return token as key
    add_image(path){
        const token = this.#make_token();
        this.#image_map[token] = path;
        return token;
    }
};

export default Token_Helper;