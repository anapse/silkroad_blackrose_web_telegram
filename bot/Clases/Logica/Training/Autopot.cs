using bot.Clases.infoclass;
using bot.SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.Logica.Training
{
    class Autopot
    {
        public static void UseHP()
        {
            if (!Data.dead)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_ETC_HP_POTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x08EC);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UseSHP()
        {
            if (!Data.dead)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_ETC_HP_SPOTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x08EC);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UseHGP()
        {
            if (Data.char_attackpetid != 0)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_COS_P_HGP_POTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x48EC);
                        NewPacket.WriteUInt32(Data.char_attackpetid);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UsePetHP(uint id)
        {
            if (Data.char_horseid != 0 || Data.char_attackpetid != 0)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_ETC_COS_HP_POTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x20EC);
                        NewPacket.WriteUInt32(id);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UsePetUni(uint id)
        {
            if (Data.char_horseid != 0 || Data.char_attackpetid != 0)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_COS_P_CURE_ALL"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x396C);
                        NewPacket.WriteUInt32(id);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UseUni()
        {
            if (!Data.dead)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.Contains("ITEM_ETC_CURE_ALL"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x316C);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UseVigor()
        {
            if (!Data.dead)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_ETC_ALL_POTION") || type.StartsWith("ITEM_ETC_ALL_SPOTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x18EC);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UseMP()
        {
            if (!Data.dead)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_ETC_MP_POTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x10EC);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }

        public static void UseSMP()
        {
            if (!Data.dead)
            {
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i];
                    if (type.StartsWith("ITEM_ETC_MP_SPOTION"))
                    {
                        uint slot = Data.inventoryslot[i];
                        Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYUSE, true);
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt16(0x10EC);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
        }
    }
}