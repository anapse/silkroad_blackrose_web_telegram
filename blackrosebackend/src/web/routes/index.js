/**
 * WEB ROUTES INDEX — Route Aggregator
 * 
 * Reemplaza a src/direcciones/links.js
 * Importa todas las rutas WEB y las exporta para montarlas en Express.
 */

import fragmentos from './fragments/fragmentos.routes.js';
import noticias from './pages/noticias.js';
import auth from './auth/autentificacion.routes.js';
import globales from './pages/globales.js';
import rankingsplayers from './rankings/Rplayers.js';
import datosplayer from './players/datosplayers.js';
import inventario from './inventory/inventario.js';
import rankingguild from './rankings/Rguild.js';
import rankingfortres from './rankings/Rfortres.js';
import uniquestatus from './uniqstatus/uniqs.js';
import rankingjob from './rankings/rjob.js';
import download from './pages/download.js';
import guildmember from './rankings/guildmember.js';
import uniqlogplayer from './rankings/uniqlogplayer.js';
import userexiste from './auth/registrouserexiste.js';
import registro from './pages/registro.js';
import uniqmap from './pages/uniquemapmob.js';
import inventarioavatar from './players/inventarioavatar.js';
import infoitem from './inventory/infoitem.js';
import serverevent from './fragments/serverevent.js';
import cantidadsilk from './shop/cantidadsilk.js';
import login from './pages/login.routes.js';
import players from './players/getPlayerData.js';

export const links = {
    login,
    fragmentos,
    noticias,
    auth,
    globales,
    rankingsplayers,
    datosplayer,
    inventario,
    rankingguild,
    rankingfortres,
    uniquestatus,
    rankingjob,
    download,
    guildmember,
    uniqlogplayer,
    userexiste,
    registro,
    uniqmap,
    inventarioavatar,
    infoitem,
    serverevent,
    cantidadsilk,
    players
};
