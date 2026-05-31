// src/context/GameSocketContext.jsx
// Contexto global que mantiene el WebSocket del juego vivo
// y expone el estado del jugador en tiempo real (HP, MP, EXP, posicion, inventario, etc.)

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { loadEntityData } from "../../game/utils/entityNames.js";

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

          if (msg.message?.includes("👤 Personajes") && msg.detail?.characters) {
            setCharacters(msg.detail.characters);
          }

          if (msg.detail?.type === "CHAT_MESSAGE") {
            setChatMessages((prev) => [
              ...prev.slice(-199),
              { id: Date.now() + Math.random(), chatType: msg.detail.chatType, charname: msg.detail.charname || "???", message: msg.detail.message || "", uniqueID: msg.detail.uniqueID, timestamp: Date.now(), direction: "RX" },
            ]);
          }

          if (msg.detail?.type === "PLAYER_MOVED") {
            const d = msg.detail;
            setPlayerState((prev) => ({ ...prev, region: d.region ?? prev.region, posX: d.posX ?? prev.posX, posZ: d.posZ ?? prev.posZ, posY: d.posY ?? prev.posY }));
          }

          if (msg.detail?.type === "PLAYER_POSITION_INIT") {
            const d = msg.detail;
            console.log('[PLAYER_POSITION_INIT]', JSON.stringify({ region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ }));
            // Solo actualizar si la región es válida (no 0)
            // Si region=0, el scanner no encontró posición y el frontend
            // debe mantener su fallback por raza (usePlayerInit.js)
            if (d.region && d.region > 0) {
              setPlayerState((prev) => ({ ...prev, hp: prev.hp || 0, region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ }));
            }
          }

          if (msg.detail?.type === "PLAYER_SPAWNED" || msg.status === "IN_GAME") {
            const d = msg.detail || {};
            console.log('[WS RECEIVE]', JSON.stringify({ region: d.region, posX: d.posX, posY: d.posY, posZ: d.posZ }));
            // No sobrescribir posición si ya se recibió PLAYER_POSITION_INIT
            setPlayerState((prev) => {
              const alreadyHasPos = prev.region != null && prev.region > 0;
              console.log('[WS RECEIVE] alreadyHasPos=' + alreadyHasPos + ' prev.region=' + prev.region + ' d.region=' + d.region);
              return {
                ...prev,
                hp: d.hp ?? prev.hp,
                maxHp: d.maxHp ?? d.hp ?? prev.maxHp,
                mp: d.mp ?? prev.mp,
                maxMp: d.maxMp ?? d.mp ?? prev.maxMp,
                level: d.level ?? prev.level,
                sp: d.sp ?? prev.sp,
                exp: d.exp ?? prev.exp,
                posX: alreadyHasPos ? prev.posX : (d.posX ?? prev.posX),
                posY: alreadyHasPos ? prev.posY : (d.posY ?? prev.posY),
                posZ: alreadyHasPos ? prev.posZ : (d.posZ ?? prev.posZ),
                region: alreadyHasPos ? prev.region : (d.region ?? prev.region),
              };
            });
          }

          if (msg.detail?.type === "ENTITY_SPAWN") {
            const d = msg.detail;
            // Descomprimir region en regionX/regionZ (igual que en usePlayerInit)
            const regionId = Number(d.region) || 0;
            const regionX = regionId & 0xFF;
            const regionZ = (regionId >> 8) & 0xFF;
            setEntities((prev) => ({
              ...prev,
              [d.uniqueId]: {
                ...d,
                regionX,
                regionZ,
              }
            }));
          }

          if (msg.detail?.type === "ENTITY_MOVE") {
            const d = msg.detail;
            setEntities((prev) => {
              if (!prev[d.uniqueId]) return prev;
              const regionId = Number(d.dstRegion) || 0;
              return {
                ...prev,
                [d.uniqueId]: {
                  ...prev[d.uniqueId],
                  region: d.dstRegion,
                  regionX: regionId & 0xFF,
                  regionZ: (regionId >> 8) & 0xFF,
                  posX: d.dstX,
                  posZ: d.dstZ,
                }
              };
            });
          }

          if (msg.detail?.type === "ENTITY_DESPAWN") {
            const d = msg.detail;
            setEntities((prev) => { const next = { ...prev }; delete next[d.uniqueId]; return next; });
          }

          if (msg.detail?.type === "PLAYER_MOVE_CONFIRMED") {
            // No actualizar posición aquí — el useGameLoop ya está interpolando
            // hacia _targetWX/_targetWZ. PLAYER_MOVE_CONFIRMED solo confirma
            // que el servidor aceptó el destino, no cambia la posición actual.
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
    ws.onclose = (ev) => { console.log('[WS] Closed - Code:', ev.code, 'Reason:', ev.reason); setConnected(false); socketRef.current = null; };
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
    <GameSocketContext.Provider value={{ socketRef, connected, playerState, chatMessages, events, characters, entities, connect, disconnect, send, registerPacketHandler, unregisterPacketHandler, setPlayerState, setChatMessages, setCharacters }}>
      {children}
    </GameSocketContext.Provider>
  );
}

export const useGameSocket = () => useContext(GameSocketContext);