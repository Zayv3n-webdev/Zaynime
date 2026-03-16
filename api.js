const API_BASE = "https://www.sankavollerei.com/anime/otakudesu";
const PROXY = "https://api.allorigins.win/raw?url=";

const API = {

async get(endpoint){
  try{

    const url = PROXY + encodeURIComponent(API_BASE + endpoint);
    const res = await fetch(url);

    if(!res.ok){
      throw new Error("Network error");
    }

    const json = await res.json();
    console.log("API RESPONSE:", json);

    return json.data || json.result || json.anime || json;

  }catch(err){
    console.error("API ERROR:", err);
    return [];
  }
},

async home(){

  const data = await this.get("/home");

  App.renderRow("trending-row", data.slice(0,10));
  App.renderRow("home-ongoing-row", data.slice(10,20));
  App.renderRow("home-completed-row", data.slice(20,30));

},

async ongoing(){

  const data = await this.get("/ongoing");
  App.renderGrid("ongoing-grid", data);

},

async completed(){

  const data = await this.get("/completed");
  App.renderGrid("completed-grid", data);

},

async movies(){

  const data = await this.get("/movies");
  App.renderGrid("movies-grid", data);

}

};

window.API = API;