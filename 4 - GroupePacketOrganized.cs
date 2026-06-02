using MerchBot.Data;
using MerchBot.SecurityAPI;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MerchBot.Spawn
{
    class GroupeSpawn
    {
        private static Packet GroupSpawnPacket;
        public static void GroupeSpawnB(Packet packet)
        {
            try
            {

                if (packet.ReadByte() == 1)
                {
                    MainData.groupespawncount = (int)packet.ReadUShort();
                    MainData.groupespawninfo = 1;
                }
                else
                {
                    MainData.groupespawncount = (int)packet.ReadUShort();
                    MainData.groupespawninfo = 2;
                }
                GroupSpawnPacket = new Packet(0x3019);
            }
            catch (Exception)
            {

                Program.main.listBox1.Items.Add("GroupeSpawnB Hata");
            }

        }
        public static void Manager(Packet packet)
        {
            GroupSpawnPacket.WriteByteArray(packet.GetBytes());
        }
        public static void GroupeSpawned()
        {
            try
            {
                GroupSpawnPacket.Lock();
                if (MainData.groupespawninfo == 1)
                {
                    Spawn.GroupeSpawn(GroupSpawnPacket);
                }
                else if (MainData.groupespawninfo == 2)
                {
                    Spawn.GroupeDeSpawn(GroupSpawnPacket);
                }

            }
            catch (Exception)
            {

                Program.main.listBox1.Items.Add("GroupeSpawned Hata");
            }

        }
    }
}
