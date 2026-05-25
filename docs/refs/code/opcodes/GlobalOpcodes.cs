using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases
{
    class LoginServerOpcodes
    {
        public enum SERVER_OPCODES : ushort
        {
            HANDSHAKE = 0x5000,
            BLOWFISH = 0x8000,
            AGENT_SERVER = 0x2001,
            SERVER_LIST = 0xA101,
            PATCH_INFO = 0x600D,
            GAME_LOGIN_REPLY = 0xA103,
            LOGIN_REPLY = 0xA102
        }

        public enum CLIENT_OPCODES : ushort
        {
            HANDSHAKE = 0x5000,
            HANDSHAKE_OK = 0x9000,
            ACCEPT = 0x6100,
            PING = 0x2002,
            GAME_LOGIN = 0x6103,
            REQUEST_SERVER_LIST = 0x6101,
            LOGIN = 0x6102,
            CLIENT_CHECK = 0x8194
        }

    }

    class WorldServerOpcodes
    {
        public enum SERVER_OPCODES
        {
            SERVER_CONNECTION = 0xA103,
            SERVER_ITEMMODIFYBEGIN = 0x3038, //OK
            SERVER_ITEMMODIFY = 0x3039, //OK
            SERVER_SINGLEDESPAWN = 0x3016, //OK
            SERVER_CHARDATA = 0x3013, //OK
            SERVER_MOVE = 0xB021, //OK
            SERVER_GROUPSPAWNB = 0x3017, //OK
            SERVER_GROUPSPAWNEND = 0x3018, //OK
            SERVER_SINGLESPAWN = 0x3015, //OK
            SERVER_GROUPESPAWN = 0x3019, //OK
            SERVER_CHARACTERINFO = 0x303D, //OK
            SERVER_SPEEDUPDATE = 0x30D0, //??
            SERVER_CHARACTERLISTING = 0xB007, //OK
            SERVER_OBJECTDIE = 0x30BF, //OK
            SERVER_ANGLECHANGE = 0xB024, //OK
            SERVER_BUFFINFO = 0xB0BD, // OK
            SERVER_SKILLADD = 0xB070, // OK
            SERVER_SKILLCASTED = 0xB071, //OK
            SERVER_BUFFDELL = 0xB072, // OK
            SERVER_INVENTORYMOVEMENT = 0xB034, //OK
            SERVER_EXPSPUPDATE = 0x3056, //OK
            SERVER_LVLUP = 0x3054, //OK
            SERVER_STUCK = 0xB023, //OK
            SERVER_HPMPUPDATE = 0x3057,  //OK
            SERVER_OBJECTSELECT = 0xB045, //OK
            SERVER_CHAT = 0x3026, //OK
            SERVER_CHATCOUNT = 0xB025, //OK
            SERVER_NPCSELECT = 0xB046, //OK
            SERVER_NPCDESELECT = 0xB04B, //OK
            SERVER_CONFIRMSPAWN = 0x3020, //OK
            SERVER_INVENTORYUSE = 0xB04C, //OK
            SERVER_ITEMRELEASE = 0x304D, //OK
            SERVER_STUFFUPDATE = 0x304E, //OK
            SERVER_PARTYINVITATION = 0x3080, //OK
            SERVER_STORAGEITEMS = 0x3049, //OK
            SERVER_STORAGEGOLD = 0x3047, //OK
            SERVER_STORAGEOK = 0x3048, //OK
            SERVER_INGAME_ACCEPT = 0xB001,
            SERVER_FORTRESS_NOTIFY = 0x385F,
            SERVER_SEND_FRIEND_LIST = 0x3305,
            SERVER_TICKET = 0x3206,
            SERVER_GUILD_STORAGE4 = 0x3078,
            SERVER_PARTYMATCHING = 0xB06C, //OK
            SERVER_ITEMFIXED = 0xB03E, //OK
            SERVER_OBJECTACTION = 0xB074, //OK
            SERVER_DURABILITYCHANGE = 0x3052, //OK
            SERVER_SKILLUPDATE = 0xB0A1, //OK
            SERVER_GUILDINFO = 0x3101, //OK
            SERVER_PETINFO = 0x30C8, //OK
            SERVER_HORSEACTION = 0xB0CB, //OK
            SERVER_PETSTATS = 0x30C9,
            SERVER_LEAVE_SUCCESS = 0x300A,
            SERVER_PARTYREMOVE = 0x3864, //OK
            SERVER_ACCEPTPARTY = 0x706D, //OK
            SERVER_STARTPLAYERDATA = 0x34A5,
            SERVER_ENDPLAYERDATA = 0x34A6,
            SERVER_SEND_WEATHER = 0x3809,
            SERVER_UNKNOWNINFO = 0x34F2,
            SERVER_TRANSFORM = 0x3207,
            SERVER_ITEM_UN_EFFECT = 0x3039,
            SERVER_ITEM_EFFECT = 0x3038,
            SERVER_ITEM_EQUIP_CHECK = 0x354E,
            SERVER_EMOTE = 0x3091,
            SERVER_QUESTMARK = 0xB402,
            SERVER_CHAT_ITEM = 0xB505,
            SERVER_TELEPORTOTHERSTART = 0x30D2,
            SERVER_TELEPORTIMAGE = 0x34B5,
            SERVER_SILKPACK = 0x3153,
            SERVER_ARROW_UPDATE = 0x3201,
            SERVER_PICKUPITEM_ANIM = 0x3036,
            SERVER_XTRAP_RESPONSE = 0x2113
        }

        public enum CLIENT_OPCODES
        {
            CLIENT_CHECK = 0x8194,
            CLIENT_PATCH = 0x9000,
            CLIENT_CONNECTION = 0x6103,
            CLIENT_PING = 0x2001,
            CLIENT_PING2 = 0x2002,
            CLIENT_INGAME_REQUEST = 0x7001,
            CLIENT_INGAME_SUCCESS = 0x34C5,
            CLIENT_REQUEST_WEATHER = 0x750E,
            CLIENT_LEAVE_CANCEL = 0x7006,
            CLIENT_GM = 0x7010,
            CLIENT_EMOTE = 0x3091,
            CLIENT_QUESTMARK = 0x7402,
            CLIENT_TELEPORTDATA = 0x34B6,
            CLIENT_CHAT_ITEM = 0x7505,
            CLIENT_MASTERY_UP = 0x70A2,
            CLIENT_SKILL_UP = 0x70A1,
            CLIENT_SAVE_INFO = 0x7611,
            CLIENT_GETUP = 0x3053,
            CLIENT_DISCONNECT = 0x7005,//OK
            CLIENT_TELEPORT = 0x705A, //OK
            CLIENT_GETSTORAGEITEMS = 0x703C, //OK
            CLIENT_NPCDESELECT = 0x704B, //OK
            CLIENT_CHARACTERLISTING = 0x7007, //OK
            CLIENT_INVENTORYUSE = 0x704C, //OK
            CLIENT_SELECTCHARACTER = 0x7001, //OK
            CLIENT_OBJECTACTION = 0x7074, //OK
            CLIENT_NPCSELECT = 0x7046, //OK
            CLIENT_OBJECTSELECT = 0x7045, //OK
            CLIENT_INVENTORYMOVEMENT = 0x7034, //OK
            CLIENT_CONFIRMSPAWN = 0x34C5, //OK
            CLIENT_REPAIR = 0x703E, //OK
            CLIENT_KILLHORSE = 0x70C6, //OK
            CLIENT_PETACTION = 0x70C5, //OK
            CLIENT_SITDOWN = 0x704F, //OK
            CLIENT_CHAT = 0x7025, //OK
            CLIENT_DROPGOLD = 0x7034, //OK
            CLIENT_CREATEPARTY = 0x7069, // OK
            CLIENT_PARTY = 0x3080, //OK
            CLIENT_PARTYLEAVE = 0x7061, // OK
            CLIENT_MOVEMENT = 0x7021, //OK
            CLIENT_JOINPARTY = 0x706D, //OK
            CLIENT_ACCEPTDEAD = 0x3053, //OK
            CLIENT_ZERK = 0x70A7, // OK
            CLIENT_ACCEPTPARTYREQUEST = 0x306E //OK

        }
    }
}