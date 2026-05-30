const base = "/api/";
const ipServer = "http://192.168.1.2";
const Port =":100/";
const ipport =base;
const  registrar = ipport+"registrar/"
const  existe = ipport +"existe/"
const descargas = ipport+"download"
const rnkplayer = ipport+"rplayers"
const login = ipport + "login"  // ❌ antes: "auth/login"




export const urlsapi={
    playerData: (jid) => `${ipport}player/${jid}`,
  characterData: (charid) => `${ipport}character/${charid}`,
    telegramGet: (id) => `${ipport}telegram/${id}`,
  telegramLogin: `${ipport}telegram/login`,
  telegramLink: `${ipport}telegram/link`,
    registrar,
    existe,
    descargas,
    rnkplayer,
    login, 

};