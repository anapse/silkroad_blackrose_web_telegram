using MerchBot.Data;
using MerchBot.SecurityAPI;
using MerchBot.Spawn;
using MerchBot.InventoryUpdate;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MerchBot.Objects;
using MerchBot.Movement;
using MerchBot.Party;
using MerchBot.Chat;

namespace MerchBot.Handlers
{
    class ServerHandler
    {
        public static void handler(Packet packet)
        {


         
            if (packet.Opcode == 0x303D)//HP MP STR INT PHY MAG DEFANS ETC.
            {
                KarakterSpawn.Character(packet);
            }           
            if (packet.Opcode == 0x3013)
            {
                MainData.char_Packet = packet;//MainDataPacket
            }
            if (packet.Opcode == 0x3020)
            {
                MainData.UniqueID = packet.ReadUInt();
                KarakterSpawn.HandleMainData(MainData.char_Packet);//Read MainData Packet
            }
            if (packet.Opcode == 0x3015)
            {
                Spawn.Spawn.SingleSpawn(packet);
            }
            if (packet.Opcode == 0x3016)
            {
                Spawn.Spawn.SingleDeSpawn(packet);
            }
            if (packet.Opcode == 0x3017)
            {
                GroupeSpawn.GroupeSpawnB(packet);//GroupePacketOrganized.cs
            }
            if (packet.Opcode == 0x3019)
            {
                GroupeSpawn.Manager(packet);//GroupePacketOrganized.cs
            }
            if (packet.Opcode == 0x3019)
            {
                GroupeSpawn.GroupeSpawned();//GroupePacketOrganized.cs
            }
        }
    }
}
