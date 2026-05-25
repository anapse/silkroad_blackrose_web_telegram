using bot.Clases.Controles;
using bot.Clases.Logica.Training;
using bot.SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.infoclass
{
    class BotAction
    {

        public static void Sit()
        {
            Packet NewPacket = new Packet(0x704F);
            NewPacket.WriteUInt8(4);
            Agent.Send(NewPacket);
        }

        public static void UseReturn()
        {
            if (Data.returning == 0)
            {
                Packet NewPacket = new Packet(Opcode.CLIENT_INVENTORY_ITEM_USE, true);
                for (int i = 0; i < Data.inventoryid.Count; i++)
                {
                    string type = Data.inventorytype[i].ToString();
                    if (type == "ITEM_ETC_SCROLL_RETURN_NEWBIE_01" || type == "ITEM_ETC_SCROLL_RETURN_03" || type == "ITEM_ETC_SCROLL_RETURN_02" || type == "ITEM_ETC_SCROLL_RETURN_01")
                    {
                        Data.returning = 1;
                        Data.Statistic.return_count++;
                        uint slot = Data.inventoryslot[i];
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt8(0xEC);
                        NewPacket.WriteUInt8(0x09);
                        Agent.Send(NewPacket);
                        break;
                    }
                    else
                    {
                        if (i + 1 == Data.inventorytype.Count)
                        {
                            // Globals.MainWindow.UpdateLogs("Return Scroll Not Found");
                        }
                    }
                }
            }
        }

        public static void WalkTo(double X, double Y)
        {
            uint xPos = 0;
            uint yPos = 0;

            if (X > 0 && Y > 0)
            {
                xPos = (uint)((X % 192) * 10);
                yPos = (uint)((Y % 192) * 10);
            }
            else
            {
                if (X < 0 && Y > 0)
                {
                    xPos = (uint)((192 + (X % 192)) * 10);
                    yPos = (uint)((Y % 192) * 10);
                }
                else
                {
                    if (X > 0 && Y < 0)
                    {
                        xPos = (uint)((X % 192) * 10);
                        yPos = (uint)((192 + (Y % 192)) * 10);
                    }
                }
            }

            byte xSector = (byte)((X - (int)(xPos / 10)) / 192 + 135);
            byte ySector = (byte)((Y - (int)(yPos / 10)) / 192 + 92);


            if (Data.char_horseid == 0)
            {
                Packet NewPacket = new Packet(Opcode.CLIENT_CHARACTER_MOVEMENT);
                NewPacket.WriteUInt8(1);
                if (Caracter.cave.char_incave == true)
                {
                    xPos = (uint)((X - (int)((xSector - 135) * 192)) * 10);
                    yPos = (uint)((Y - (int)((162 - 92) * 192)) * 10);
                    NewPacket.WriteUInt8(Caracter.cave.xsector);
                    NewPacket.WriteUInt8(0x80);
                    NewPacket.WriteUInt32(xPos);
                    NewPacket.WriteUInt32(0x00000000);
                    Packet packet = new Packet(0x0000);
                    packet.WriteUInt32(yPos - 250);
                    NewPacket.WriteUInt8(packet.ReadUInt8());
                    NewPacket.WriteUInt8(packet.ReadUInt8());
                    NewPacket.WriteUInt8(0xFF);
                    NewPacket.WriteUInt8(0xFF);
                }
                else
                {
                    ushort xposition = (ushort)((X - (int)((xSector - 135) * 192)) * 10);
                    ushort yposition = (ushort)((Y - (int)((ySector - 92) * 192)) * 10);
                    NewPacket.WriteUInt8(xSector);
                    NewPacket.WriteUInt8(ySector);
                    NewPacket.WriteUInt16(xposition);
                    NewPacket.WriteUInt16(0x0000);
                    NewPacket.WriteUInt16(yposition);
                }
                Agent.Send(NewPacket);
            }
            else
            {
                Packet NewPacket = new Packet(Opcode.CLIENT_CHARACTER_PET_ACTION);
                NewPacket.WriteUInt32(Data.char_horseid);
                NewPacket.WriteUInt8(1);
                NewPacket.WriteUInt8(1);
                if (Caracter.cave.char_incave == true)
                {
                    xPos = (uint)((X - (int)((xSector - 135) * 192)) * 10);
                    yPos = (uint)((Y - (int)((162 - 92) * 192)) * 10);

                    NewPacket.WriteUInt8(Caracter.cave.xsector);
                    NewPacket.WriteUInt8(0x80);
                    NewPacket.WriteUInt32(xPos);
                    NewPacket.WriteUInt32(0x00000000);
                    Packet packet = new Packet(0x0000);
                    packet.WriteUInt32(yPos - 250);
                    NewPacket.WriteUInt8(packet.ReadUInt8());
                    NewPacket.WriteUInt8(packet.ReadUInt8());
                    NewPacket.WriteUInt8(0xFF);
                    NewPacket.WriteUInt8(0xFF);
                }
                else
                {
                    ushort xposition = (ushort)((X - (int)((xSector - 135) * 192)) * 10);
                    ushort yposition = (ushort)((Y - (int)((ySector - 92) * 192)) * 10);
                    NewPacket.WriteUInt8(xSector);
                    NewPacket.WriteUInt8(ySector);
                    NewPacket.WriteUInt16(xposition);
                    NewPacket.WriteUInt16(0xF400);
                    NewPacket.WriteUInt16(yposition);
                }
                Agent.Send(NewPacket);
            }
        }

        public static void AttackWithPet()
        {
            if (Data.char_attackpetid != 0)
            {
                Packet NewPacket = new Packet(Opcode.CLIENT_CHARACTER_PET_ACTION);
                NewPacket.WriteUInt32(Data.char_attackpetid);
                NewPacket.WriteUInt8(0x02);
                NewPacket.WriteUInt32(Training.monster_id);
                Agent.Send(NewPacket);
            }
        }

        public static void MountHorse()
        {
            byte found_horse = 0;
            for (int i = 0; i < Data.inventoryid.Count; i++)
            {
                string type = Data.inventorytype[i].ToString();
                if (type.StartsWith("ITEM_COS_C_HORSE") || type.StartsWith("ITEM_COS_C_DHORSE"))
                {
                    if (Caracter.Level >= (Data.inventorylevel[i]))
                    {
                        found_horse = 1;
                        Packet NewPacket = new Packet(Opcode.CLIENT_INVENTORY_ITEM_USE, true);
                        uint slot = Data.inventoryslot[i];
                        NewPacket.WriteUInt8((byte)slot);
                        NewPacket.WriteUInt8(0xEC);
                        NewPacket.WriteUInt8(0x11);
                        Agent.Send(NewPacket);
                        break;
                    }
                }
            }
            if (found_horse == 0)
            {
                Data.loopend = 1;
                // StartLooping.LoadTrainScript();
            }
        }
    }
}
