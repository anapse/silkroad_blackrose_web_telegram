using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Silkroad
{
    class GroupeSpawn
    {
        public static Packet GroupeSpawnPacket = new Packet((ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_GROUPESPAWN, false, enumDestination.Client);

        #region Ready New Packet
        public static void GroupeSpawnB(Packet packet)
        {
            GroupeSpawnPacket = new Packet((ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_GROUPESPAWN, false, enumDestination.Client);
            if (packet.data.ReadBYTE() == 1)
            {
                BotData.groupespawncount = (int)packet.data.ReadWORD();
                BotData.groupespawninfo = 1;
            }
            else
            {
                BotData.groupespawncount = (int)packet.data.ReadWORD();
                BotData.groupespawninfo = 2;
            }
        }
        #endregion
        #region Create Packet
        public static void Manager(Packet packet)
        {
            for (int i = 0; i < packet.data.len; i++)
            {
                GroupeSpawnPacket.data.AddBYTE(packet.data.ReadBYTE());
            }
        }
        #endregion
        #region Parse Created Packet
        public static void GroupeSpawned()
        {
            //Globals.Debug("SPAWN", "COUNT: " + BotData.groupespawncount, GroupeSpawnPacket);
            Spawn.GroupeSpawn(GroupeSpawnPacket);
        }
        #endregion
    }
}