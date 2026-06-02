// src/context/GameSocketContext.jsx
// Contexto global que mantiene el WebSocket del juego vivo
// y expone el estado del jugador en tiempo real (HP, MP, EXP, posicion, inventario, etc.)

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { loadEntityData } from "../../game/utils/entityNames.js";
import { GAME_CONSTANTS } from "../constants/gameConstants.js";
const UNITS_PER_REGION = GAME_CONSTANTS.MAP.UNITS_PER_REGION;

// Valor por defecto para evitar crashes cuando el provider no está montado
const defaultContext = {
  socketRef: { current: null },
  connected: false,
  playerState: {},
  chatMessages: [],
  events: [],
  characters: [],
  entities: {},
  connect: () => console.warn('[GameSocket] No provider available'),
  disconnect: () => {},
  send: () => {},
  registerPacketHandler: () => {},
  unregisterPacketHandler: () => {},
  setPlayerState: () => {},
  setChatMessages: () => {},
  setCharacters: () => {},
};

const GameSocketContext = createContext(defaultContext);

function getGatewayUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws`;
}

export function GameSocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [serverDisconnected, setServerDisconnected] = useState(false);

  // Cargar datos de mobs/npcs AL INICIO para que estén listos cuando se necesiten
  useEffect(() => {
    loadEntityData();
  }, []);
  const [playerState, setPlayerState] = useState({
    hp: 0,
    maxHp: 0,
    mp: 0,
    maxMp: 0,
    exp: 0,
    level: 0,
    sp: 0,
    posX: null,
    posY: null,
    posZ: null,
    region: null,
    inventory: [],
    inventoryCapacity: 0,
    skills: [],
    buffs: [],
    gold: 0,
    stallTitle: "",
    inStall: false,
    inParty: false,
    partyMembers: [],
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [entities, setEntities] = useState({});

  const packetHandlersRef = useRef({});
  const nameCacheRef = useRef({});

  const registerPacketHandler = useCallback((opcode, handler) => {
    packetHandlersRef.current[opcode] = handler;
  }, []);

  const unregisterPacketHandler = useCallback((opcode) => {
    delete packetHandlersRef.current[opcode];
  }, []);

  const connect = useCallback(() => {
    const state = socketRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current = null;
    }

    const ws = new WebSocket(getGatewayUrl());
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "STATUS") {
          return;
        }
        if (msg.type === "CAPTCHA") return;

        if (msg.type === "EVENT") {
          setEvents((prev) => [...prev.slice(-99), { ...msg, timestamp: Date.now() }]);

          // Detectar desconexión del servidor de juego
          if (msg.message && typeof msg.message === 'string' && msg.message.includes('Desconectado')) {
            setServerDisconnected(true);
            setConnected(false);
          }

          if (msg.message?.includes("👤 Personajes") && msg.detail?.characters) {
            setCharacters(msg.detail.characters);
          }

          if (msg.detail?.type === "CHAT_MESSAGE") {
            // Capturar nombre del chat para el nameCache
            if (msg.detail.uniqueID && msg.detail.charname) {
              nameCacheRef.current[msg.detail.uniqueID] = msg.detail.charname;
              console.log(`[nameCache] 📝 ${msg.detail.uniqueID} → ${msg.detail.charname}`);
            }
            setChatMessages((prev) => [
              ...prev.slice(-199),
              { id: Date.now() + Math.random(), chatType: msg.detail.chatType, charname: msg.detail.charname || "???", message: msg.detail.message || "", uniqueID: msg.detail.uniqueID, timestamp: Date.now(), direction: "RX" },
            ]);
          }

          if (msg.detail?.type === "PLAYER_MOVED") {
            const d = msg.detail;
            setPlayerState((prev) => ({ ...prev, region: d.region ?? prev.region, posX: d.posX ?? prev.posX, posZ: d.posZ ?? prev.posZ, posY: d.posY ?? prev.posY }));
          }

          if (msg.detail?.type === "PLAYER_UPDATE") {
            const d = msg.detail;
            setPlayerState((prev) => {
              // Nunca pisar posición válida con undefined
              const newRegion = (d.region != null && d.region > 0) ? d.region : prev.region;
              const newPosX = (d.posX != null) ? d.posX : prev.posX;
              const newPosY = (d.posY != null) ? d.posY : prev.posY;
              const newPosZ = (d.posZ != null) ? d.posZ : prev.posZ;

              return {
                ...prev,
                hp: d.hp ?? prev.hp,
                maxHp: d.maxHp ?? d.hp ?? prev.maxHp,
                mp: d.mp ?? prev.mp,
                maxMp: d.maxMp ?? d.mp ?? prev.maxMp,
                level: d.level ?? prev.level,
                sp: d.sp ?? prev.sp,
                exp: d.exp ?? prev.exp,
                region: newRegion,
                posX: newPosX,
                posY: newPosY,
                posZ: newPosZ,
              };
            });
          }

          if (msg.detail?.type === "PLAYER_STOPPED") {
            const d = msg.detail;
            // El servidor detuvo al jugador (colisión o llegada a destino)
            setPlayerState((prev) => {
              if (!d.region || d.region <= 0) {
                return { ...prev, _stopped: Date.now() };
              }
              return {
                ...prev,
                region: d.region,
                posX: (d.posX != null) ? d.posX : prev.posX,
                posY: (d.posY != null) ? d.posY : prev.posY,
                posZ: (d.posZ != null) ? d.posZ : prev.posZ,
                _stopped: Date.now(),
              };
            });
          }

          if (msg.detail?.type === "PLAYER_POSITION_INIT") {
            const d = msg.detail;
            // console.log('[PLAYER_POSITION_INIT]', JSON.stringify({ region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ }));
            // Solo actualizar si la región es válida (no 0)
            // Si region=0, el scanner no encontró posición y el frontend
            // debe mantener su fallback por raza (usePlayerInit.js)
            if (d.region && d.region > 0) {
              setPlayerState((prev) => {
                const next = { ...prev, hp: prev.hp || 0, region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ };
                return next;
              });
            }
          }

          if (msg.detail?.type === "PLAYER_SPAWNED" || msg.status === "IN_GAME") {
            const d = msg.detail || {};
            setPlayerState((prev) => {
              // Nunca pisar posición válida con undefined
              const newRegion = (d.region != null && d.region > 0) ? d.region : prev.region;
              const newPosX = (d.posX != null) ? d.posX : prev.posX;
              const newPosY = (d.posY != null) ? d.posY : prev.posY;
              const newPosZ = (d.posZ != null) ? d.posZ : prev.posZ;

              return {
                ...prev,
                hp: d.hp ?? prev.hp,
                maxHp: d.maxHp ?? d.hp ?? prev.maxHp,
                mp: d.mp ?? prev.mp,
                maxMp: d.maxMp ?? d.mp ?? prev.maxMp,
                level: d.level ?? prev.level,
                sp: d.sp ?? prev.sp,
                exp: d.exp ?? prev.exp,
                region: newRegion,
                posX: newPosX,
                posY: newPosY,
                posZ: newPosZ,
              };
            });
          }

          if (msg.detail?.type === "ENTITY_SPAWN") {
            const d = msg.detail;
            // Descomprimir region en regionX/regionZ (igual que en usePlayerInit)
            const regionId = Number(d.region) || 0;
            const regionX = regionId & 0xFF;
            const regionZ = (regionId >> 8) & 0xFF;
            // Calcular world units USANDO SISTEMA CENTRADO
            const worldX = ((regionX - 135) * UNITS_PER_REGION) + (d.posX || 0);
            const worldZ = ((regionZ - 92) * UNITS_PER_REGION) + (d.posZ || 0);
            const entityType = d.entityType || '?';
            const entityName = d.name || `${entityType}#${d.uniqueId}`;
            // Log solo para CHARs (otros jugadores)
            if (entityType === 'CHAR') {
              console.log(`👤 [PLAYER] ${entityName} uid=${d.uniqueId} refObjId=${d.refObjId} world=(${worldX},${worldZ})`);
            }
            setEntities((prev) => {
              const updated = {
                ...prev,
                [d.uniqueId]: {
                  ...d,
                  regionX,
                  regionZ,
                  worldX,
                  worldZ,
                }
              };
              return updated;
            });
          }

          if (msg.detail?.type === "ENTITY_UPDATE") {
            const d = msg.detail;
            if (d.uniqueId) {
              const updateData = {};
              if (d.stallFlag !== undefined) updateData.stallFlag = d.stallFlag;
              if (d.stallName !== undefined) updateData.stallName = d.stallName;
              if (Object.keys(updateData).length > 0) {
                console.log(`[ENTITY_UPDATE] 🔄 uid=${d.uniqueId}`, updateData);
                setEntities((prev) => {
                  if (!prev[d.uniqueId]) return prev;
                  return { ...prev, [d.uniqueId]: { ...prev[d.uniqueId], ...updateData } };
                });
              }
            }
          }

          if (msg.detail?.type === "ENTITY_MOVE") {
            const d = msg.detail;
            // Ignorar si no hay destino válido (evita NaN)
            if (!d.dstRegion || d.dstRegion <= 0 || d.dstX == null || d.dstZ == null) {
              console.warn(`[ENTITY_MOVE] ⚠️ uid=${d.uniqueId} destino inválido, ignorando`, d);
              return;
            }
            console.log(`[ENTITY_MOVE] 🚶 uid=${d.uniqueId} dstRegion=${d.dstRegion} dstX=${d.dstX} dstZ=${d.dstZ}`);
            setEntities((prev) => {
              if (!prev[d.uniqueId]) {
                console.log(`[ENTITY_MOVE] ⚠️ uid=${d.uniqueId} NO ENCONTRADO - CREANDO como CHAR`);
                // Buscar nombre en caché
                const cachedName = nameCacheRef.current[d.uniqueId];
                const newName = cachedName ? cachedName : `Player#${d.uniqueId}`;
                // Crear la entidad sobre la marcha con los datos del movimiento
                const regionId = Number(d.dstRegion) || 0;
                const dstRegionX = regionId & 0xFF;
                const dstRegionZ = (regionId >> 8) & 0xFF;
                const dstWorldX = ((dstRegionX - 135) * UNITS_PER_REGION) + (d.dstX || 0);
                const dstWorldZ = ((dstRegionZ - 92) * UNITS_PER_REGION) + (d.dstZ || 0);
                return {
                  ...prev,
                  [d.uniqueId]: {
                    uniqueId: d.uniqueId,
                    entityType: 'CHAR',
                    region: d.dstRegion,
                    regionX: dstRegionX,
                    regionZ: dstRegionZ,
                    posX: d.dstX,
                    posZ: d.dstZ,
                    posY: d.dstY || 0,
                    worldX: dstWorldX,
                    worldZ: dstWorldZ,
                    name: newName,
                    _targetWX: dstWorldX,
                    _targetWZ: dstWorldZ,
                  }
                };
              }
              const regionId = Number(d.dstRegion) || 0;
              const dstRegionX = regionId & 0xFF;
              const dstRegionZ = (regionId >> 8) & 0xFF;
              // Calcular world units del destino USANDO SISTEMA CENTRADO
              const dstWorldX = ((dstRegionX - 135) * UNITS_PER_REGION) + (d.dstX || 0);
              const dstWorldZ = ((dstRegionZ - 92) * UNITS_PER_REGION) + (d.dstZ || 0);
              return {
                ...prev,
                [d.uniqueId]: {
                  ...prev[d.uniqueId],
                  region: d.dstRegion,
                  regionX: dstRegionX,
                  regionZ: dstRegionZ,
                  posX: d.dstX,
                  posZ: d.dstZ,
                  worldX: dstWorldX,
                  worldZ: dstWorldZ,
                  _targetWX: dstWorldX,
                  _targetWZ: dstWorldZ,
                }
              };
            });
          }

          if (msg.detail?.type === "ENTITY_DESPAWN") {
            const d = msg.detail;
            setEntities((prev) => { const next = { ...prev }; delete next[d.uniqueId]; return next; });
          }

          if (msg.detail?.type === "PLAYER_MOVE_CONFIRMED") {
            // El servidor confirmó el movimiento (0xB021).
            // Actualizar posición directamente — la suavidad visual la dan
            // las transiciones CSS del canvas offset y el dot del player.
            const d = msg.detail;
            if (d.dstRegion != null && d.dstRegion > 0 && d.dstX != null && d.dstZ != null) {
              setPlayerState((prev) => {
                const updates = { region: d.dstRegion, posX: d.dstX, posZ: d.dstZ };
                if (d.dstY != null && d.dstY > 0) updates.posY = d.dstY;
                return { ...prev, ...updates };
              });
            }
          }

          if (msg.detail?.type === "PLAYER_UPDATE") {
            const d = msg.detail;
            setPlayerState((prev) => {
              // Solo actualizar posición si la región coincide con la actual
              // (evita que 0xB023 de un movimiento lejano sobreescriba la posición)
              const sameRegion = d.region == null || d.region === prev.region;
              return {
                ...prev,
                hp: d.hp ?? prev.hp,
                maxHp: d.maxHp ?? prev.maxHp,
                mp: d.mp ?? prev.mp,
                maxMp: d.maxMp ?? d.mp ?? prev.maxMp,
                exp: d.exp ?? prev.exp,
                level: d.level ?? prev.level,
                sp: d.sp ?? prev.sp,
                region: d.region ?? prev.region,
                posX: sameRegion ? (d.posX ?? prev.posX) : prev.posX,
                posY: sameRegion ? (d.posY ?? prev.posY) : prev.posY,
                posZ: sameRegion ? (d.posZ ?? prev.posZ) : prev.posZ,
              };
            });
          }

          if (msg.detail?.type === "INVENTORY_DATA") {
            setPlayerState((prev) => ({ inventory: msg.detail.inventory ?? prev.inventory, gold: msg.detail.gold ?? prev.gold, inventoryCapacity: msg.detail.maxSlots ?? prev.inventoryCapacity }));
          }

          if (msg.detail?.type === "INVENTORY_MOVEMENT") {
            const data = msg.detail.data;
            if (data) {
              setPlayerState((prev) => {
                const inv = [...(prev.inventory || [])];
                const mt = msg.detail.movementType;
                if (mt === 0 && data.slotSrc !== undefined && data.slotDst !== undefined) {
                  const si = inv.findIndex((it) => it.slot === data.slotSrc);
                  const di = inv.findIndex((it) => it.slot === data.slotDst);
                  const sItem = si >= 0 ? { ...inv[si] } : null;
                  const dItem = di >= 0 ? { ...inv[di] } : null;
                  if (si >= 0) inv.splice(si, 1);
                  if (di >= 0) inv.splice(di, 1);
                  if (sItem) { sItem.slot = data.slotDst; inv.push(sItem); }
                  if (dItem) { dItem.slot = data.slotSrc; inv.push(dItem); }
                }
                if (mt === 6 && data.item && data.slotInventory !== undefined) {
                  const ex = inv.findIndex((it) => it.slot === data.slotInventory);
                  if (ex >= 0) inv[ex] = { ...data.item, slot: data.slotInventory };
                  else inv.push({ ...data.item, slot: data.slotInventory });
                }
                if ((mt === 7 || mt === 9 || mt === 15) && data.slotInventory !== undefined) {
                  const ex = inv.findIndex((it) => it.slot === data.slotInventory);
                  if (ex >= 0) inv.splice(ex, 1);
                }
                if (mt === 2 && data.slotInventory !== undefined) {
                  const ex = inv.findIndex((it) => it.slot === data.slotInventory);
                  if (ex >= 0) inv.splice(ex, 1);
                }
                return { ...prev, inventory: inv };
              });
            }
          }

          if (msg.detail?.type === "INVENTORY_UPDATE") {
            setPlayerState((prev) => ({ ...prev, inventory: msg.detail.items ?? prev.inventory, gold: msg.detail.gold ?? prev.gold }));
          }

          if (msg.detail?.type === "SKILL_UPDATE") {
            setPlayerState((prev) => ({ ...prev, skills: msg.detail.skills ?? prev.skills }));
          }

          if (msg.detail?.type === "BUFF_UPDATE") {
            setPlayerState((prev) => ({ ...prev, buffs: msg.detail.buffs ?? prev.buffs }));
          }

          if (msg.detail?.type === "PARTY_UPDATE") {
            setPlayerState((prev) => ({ ...prev, inParty: msg.detail.inParty ?? prev.inParty, partyMembers: msg.detail.members ?? prev.partyMembers }));
          }

          if (msg.detail?.type === "STALL_UPDATE") {
            setPlayerState((prev) => ({ ...prev, inStall: msg.detail.active ?? prev.inStall, stallTitle: msg.detail.title ?? prev.stallTitle }));
          }

          return;
        }

        if (msg.type === "PACKET" && msg.opcode) {
          const handler = packetHandlersRef.current[msg.opcode];
          if (handler) handler(msg);
        }
      } catch {}
    };

    ws.onerror = (err) => console.error('[WS] Error:', err.message || 'Unknown error');
    ws.onclose = (ev) => {
      console.log('[WS] Closed - Code:', ev.code, 'Reason:', ev.reason);
      setConnected(false);
      setServerDisconnected(true);
      socketRef.current = null;
    };
  }, []);

  const reconnect = useCallback(() => {
    // Recargar la página para reiniciar todo el estado limpio
    window.location.reload();
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        const sock = socketRef.current;
        sock.onclose = null;
        sock.onerror = null;
        sock.close();
      }
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  const send = useCallback((data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        const sock = socketRef.current;
        sock.onclose = null;
        sock.onerror = null;
        const state = sock.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) sock.close();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <GameSocketContext.Provider value={{ socketRef, connected, serverDisconnected, playerState, chatMessages, events, characters, entities, setEntities, connect, reconnect, disconnect, send, registerPacketHandler, unregisterPacketHandler, setPlayerState, setChatMessages, setCharacters }}>
      {children}
    </GameSocketContext.Provider>
  );
}

export const useGameSocket = () => useContext(GameSocketContext);