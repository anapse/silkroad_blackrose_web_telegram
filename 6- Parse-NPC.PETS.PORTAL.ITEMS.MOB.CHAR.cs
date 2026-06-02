using MerchBot.Data;
using MerchBot.Data.Spawns;
using MerchBot.SecurityAPI;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MerchBot.Spawn
{
    class Parse
    {

        public static void ParseNPC(Packet packet, int index)
        {
            try
            {

                uint id = packet.ReadUInt();
                Spawns.npcid.Add(id);
                Spawns.npctype.Add(Mobs_Info.mobstypelist[index]);
                byte xsec = packet.ReadByte();
                byte ysec = packet.ReadByte();
                float xcoord = packet.ReadFloat();
                packet.ReadFloat();
                float ycoord = packet.ReadFloat();

                packet.ReadUShort(); // Position
                byte move = packet.ReadByte(); // Moving
                packet.ReadByte(); // Running

                if (move == 1)
                {
                    xsec = packet.ReadByte();
                    ysec = packet.ReadByte();
                    if (ysec == 0x80)
                    {
                        xcoord = packet.ReadUShort() - packet.ReadUShort();
                        packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort() - packet.ReadUShort();
                    }
                    else
                    {
                        xcoord = packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort();
                    }
                }
                else
                {
                    packet.ReadByte(); // Unknown
                    packet.ReadUShort(); // Unknwon
                }

                packet.ReadULong(); //Unknown
                packet.ReadULong(); //Unknown
                ushort check = packet.ReadUShort();
                if (check != 0)
                {
                    byte count = packet.ReadByte();
                    for (byte i = 0; i < count; i++)
                    {
                        packet.ReadByte();
                    }
                }

            }
            catch (Exception ex)
            {

                Program.main.listBox1.Items.Add("Parse Npc Hata" + ex);
            }


        }

        public static void ParsePets(Packet packet, int index)
        {


            try
            {

                int s_index = 0;
                for (int i = 0; i < Spawns.pets.Length; i++)
                {
                    if (Spawns.pets[i].type == null)
                    {
                        s_index = i;
                        break;
                    }
                }
                uint pet_id = packet.ReadUInt(); // PET ID
                Spawns.pets[s_index].id = pet_id;
                Spawns.pets[s_index].type = Mobs_Info.mobstypelist[index];
                byte xsec = packet.ReadByte();
                byte ysec = packet.ReadByte();
                float xcoord = packet.ReadFloat();
                packet.ReadFloat();
                float ycoord = packet.ReadFloat();

                packet.ReadUShort(); // Position
                byte move = packet.ReadByte(); // Moving
                packet.ReadByte(); // Running

                if (move == 1)
                {
                    xsec = packet.ReadByte();
                    ysec = packet.ReadByte();
                    if (ysec == 0x80)
                    {
                        xcoord = packet.ReadUShort() - packet.ReadUShort();
                        packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort() - packet.ReadUShort();
                    }
                    else
                    {
                        xcoord = packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort();
                    }
                }
                else
                {
                    packet.ReadByte(); // Unknown
                    packet.ReadUShort(); // Unknwon
                }
                Spawns.pets[s_index].x = Convert.ToInt32((xsec - 135) * 192 + (xcoord / 10));
                Spawns.pets[s_index].y = Convert.ToInt32((ysec - 92) * 192 + (ycoord / 10));
                packet.ReadByte();
                packet.ReadByte();
                packet.ReadByte();
                packet.ReadByte();
                packet.ReadFloat();
                Spawns.pets[s_index].speed = packet.ReadFloat();

                packet.ReadFloat();
                packet.ReadUShort();
                string type = Mobs_Info.mobstypelist[index];
                //if (Mobs_Info.mobstypelist[index].StartsWith("COS_C_PEGASUS") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_OSTRICH") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_SCARABAEUS") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_TIGER") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_WILDPIG") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_HORSE") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_CAMEL") || Mobs_Info.mobstypelist[index].StartsWith("COS_T_DHORSE") || Mobs_Info.mobstypelist[index].StartsWith("COS_C_DHORSE"))
                if (Mobs_Info.mobstypelist[index].StartsWith("COS_C") || Mobs_Info.mobstypelist[index].StartsWith("COS_T_DHORSE"))
                {
                }
                else
                {
                    if (type.StartsWith("COS_U_UNKNOWN"))
                    {
                        packet.ReadUShort();
                        packet.ReadByte();
                    }
                    else
                    {
                        packet.ReadAscii();
                        if (type.StartsWith("COS_T_COW") || type == "COS_T_DONKEY" | type.StartsWith("COS_T_HORSE") || type.StartsWith("COS_T_CAMEL") || type.StartsWith("COS_T_DHORSE") || type.StartsWith("COS_T_BUFFALO") || type.StartsWith("COS_T_WHITEELEPHANT") || type.StartsWith("COS_T_RHINOCEROS"))
                        {
                            if (type.StartsWith("COS_T_BUFFALO") || type.StartsWith("COS_T_WHITEELEPHANT") || type.StartsWith("COS_T_RHINOCEROS"))
                            {
                                packet.ReadByte();
                            }
                            packet.ReadUShort();
                            packet.ReadUInt();
                        }
                        else
                        {
                            packet.ReadAscii();
                            if (type.StartsWith("COS_P_RAVEN"))
                            {
                                packet.ReadByte();
                            }
                            if (type.StartsWith("COS_P_WOLF"))
                            {
                                packet.ReadByte();
                            }
                            if (type.StartsWith("COS_P_BROWNIE"))
                            {
                                packet.ReadUInt();
                                packet.ReadByte();
                            }
                            else
                            {
                                if (type.StartsWith("COS_P_JINN") || type.StartsWith("COS_P_KANGAROO") || type.StartsWith("COS_P_BEAR") || type.StartsWith("COS_P_FOX") || type.StartsWith("COS_P_PENGUIN"))
                                {
                                    packet.ReadByte();
                                }
                                packet.ReadByte();
                                packet.ReadUInt();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Program.main.listBox1.Items.Add("Parse Pets Hata" + ex);
            }

        }

        public static void ParsePortal(Packet packet, int index)
        {
            try
            {
                uint id = packet.ReadUInt();
                Spawns.npcid.Add(id);
                Spawns.npctype.Add(Mobs_Info.mobstypelist[index]);
                byte xsec = packet.ReadByte();
                byte ysec = packet.ReadByte();
                float xcoord = packet.ReadFloat();
                packet.ReadFloat();
                float ycoord = packet.ReadFloat();
                packet.ReadUShort(); // Position
                packet.ReadUInt();
                packet.ReadULong();
            }
            catch (Exception ex)
            {

                Program.main.listBox1.Items.Add("Parse Portal Hata" + ex);
            }

        }

        public static void ParseItems(Packet packet, int itemsindex)
        {
            try
            {


                string type = Items_Info.itemstypelist[itemsindex].ToString();
                if (type.StartsWith("ITEM_ETC_GOLD"))
                {
                    packet.ReadUInt(); // Ammount
                }
                if (type.StartsWith("ITEM_QSP"))
                {
                    packet.ReadAscii();// Name
                }
                if (type.StartsWith("ITEM_CH") || type.StartsWith("ITEM_EU"))
                {
                    packet.ReadByte(); // Plus
                }
                uint id = packet.ReadUInt(); // ID
                packet.ReadByte(); //XSEC
                packet.ReadByte(); //YSEC
                packet.ReadFloat(); //X
                packet.ReadFloat(); //Z
                packet.ReadFloat(); //Y
                packet.ReadUShort(); //POS
                if (packet.ReadByte() == 1) // Owner exist
                {
                    if (packet.ReadUInt() == MainData.AccountID) // Owner ID
                    {
                        Spawns.item_id.Add(id);
                        Spawns.item_status.Add(0);
                        Spawns.item_type.Add(type);
                        // PickupControl.there_is_pickable = true;
                    }
                }
                packet.ReadByte(); //Item Blued
            }
            catch (Exception ex)
            {
                Program.main.listBox1.Items.Add("ParseItemHata");
            }
        }

        public static void ParseMob(Packet packet, int index)
        {
            try
            {
                uint id = packet.ReadUInt(); // MOB ID
                byte xsec = packet.ReadByte();
                byte ysec = packet.ReadByte();
                float xcoord = packet.ReadFloat();
                packet.ReadFloat();
                float ycoord = packet.ReadFloat();
                packet.ReadUShort(); // Position
                byte move = packet.ReadByte(); // Moving
                packet.ReadByte(); // Running
                if (move == 1)
                {
                    xsec = packet.ReadByte();
                    ysec = packet.ReadByte();
                    if (ysec == 0x80)
                    {
                        xcoord = packet.ReadUShort() - packet.ReadUShort();
                        packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort() - packet.ReadUShort();
                    }
                    else
                    {
                        xcoord = packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort();
                    }
                }
                else
                {
                    packet.ReadByte(); // Unknown
                    packet.ReadUShort(); // Unknwon
                }
                int xas = Convert.ToInt32((xsec - 135) * 192 + (xcoord / 10));
                int yas = Convert.ToInt32((ysec - 92) * 192 + (ycoord / 10));
                int dist = Math.Abs((xas - MainData.XCoord)) + Math.Abs((yas - MainData.YCoord));
                byte alive = packet.ReadByte(); // Alive
                packet.ReadByte(); // Unknown
                packet.ReadByte(); // Unknown
                packet.ReadByte(); // Zerk Active
                packet.ReadFloat(); // Walk Speed
                packet.ReadFloat(); // Run Speed
                packet.ReadFloat(); // Zerk Speed
                packet.ReadUInt(); // Unknown
                byte type = packet.ReadByte();
                if (alive == 1)
                {
                    Spawns.mob_id.Add(id);
                    Spawns.mob_name.Add(Mobs_Info.mobsnamelist[index]);
                    Spawns.mob_dist.Add(dist);
                    Spawns.mob_x.Add(xas);
                    Spawns.mob_y.Add(yas);
                    Spawns.mob_status.Add(0);
                    Spawns.mob_type.Add(type);
                    Spawns.mob_priority.Add(0);


                }
            }
            catch (Exception ex)
            {
            }
        }

        public static void ParseChar(Packet packet, int index)
        {
            try
            {
                int s_index = 0;
                for (int i = 0; i < Spawns.characters.Length; i++)
                {
                    if (Spawns.characters[i].charname == null)
                    {
                        s_index = i;
                        break;
                    }
                }
                int trade = 0;
                int stall = 0;
                packet.ReadByte(); // Volume/Height
                packet.ReadByte(); // Rank
                packet.ReadByte(); // Icons
                packet.ReadByte(); // Unknown
                packet.ReadByte(); // Max Slots
                int items_count = packet.ReadByte();
                Spawns.characters[s_index].wear = new Spawns.Characters_.Wear_[items_count];
                for (int a = 0; a < items_count; a++)
                {
                    uint itemid = packet.ReadUInt();
                    int itemindex = Items_Info.itemsidlist.IndexOf(itemid);
                    if (Items_Info.itemstypelist[itemindex].StartsWith("ITEM_CH") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_EU") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_FORT") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_ROC_CH") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_ROC_EU"))
                    {
                        byte plus = packet.ReadByte(); // Item Plus
                        Spawns.characters[s_index].wear[a].name = Items_Info.itemsnamelist[itemindex];
                        Spawns.characters[s_index].wear[a].type = Items_Info.itemstypelist[itemindex];
                        Spawns.characters[s_index].wear[a].plus = plus;
                    }
                    if (Items_Info.itemstypelist[itemindex].StartsWith("ITEM_EU_M_TRADE") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_EU_F_TRADE") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_CH_M_TRADE") || Items_Info.itemstypelist[itemindex].StartsWith("ITEM_CH_W_TRADE"))
                    {
                        trade = 1;
                    }
                }
                packet.ReadByte(); // Max Avatars Slot
                int avatar_count = packet.ReadByte();
                for (int a = 0; a < avatar_count; a++)
                {
                    uint avatarid = packet.ReadUInt();
                    int avatarindex = Items_Info.itemsidlist.IndexOf(avatarid);
                    byte plus = packet.ReadByte(); // Avatar Plus
                    if (avatarindex == -1)
                    {
                        Program.main.listBox1.Items.Add("Error on avatars !!! Avatar ID: " + avatarid);
                    }
                }
                int mask = packet.ReadByte();
                if (mask == 1)
                {
                    uint id = packet.ReadUInt();
                    string type = Mobs_Info.mobstypelist[Mobs_Info.mobsidlist.IndexOf(id)];
                    if (type.StartsWith("CHAR"))
                    {
                        packet.ReadByte();
                        byte count = packet.ReadByte();
                        for (int i = 0; i < count; i++)
                        {
                            packet.ReadUInt();
                        }
                    }
                }
                Spawns.characters[s_index].id = packet.ReadUInt();
                byte xsec = packet.ReadByte();
                byte ysec = packet.ReadByte();
                float xcoord = packet.ReadFloat();
                packet.ReadFloat();
                float ycoord = packet.ReadFloat();

                packet.ReadUShort(); // Position
                byte move = packet.ReadByte(); // Moving
                packet.ReadByte(); // Running

                if (move == 1)
                {
                    xsec = packet.ReadByte();
                    ysec = packet.ReadByte();
                    if (ysec == 0x80)
                    {
                        xcoord = packet.ReadUShort() - packet.ReadUShort();
                        packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort() - packet.ReadUShort();
                    }
                    else
                    {
                        xcoord = packet.ReadUShort();
                        packet.ReadUShort();
                        ycoord = packet.ReadUShort();
                    }
                }
                else
                {
                    packet.ReadByte(); // No Destination
                    packet.ReadUShort(); // Angle
                }

                Spawns.characters[s_index].alive = packet.ReadByte(); // Alive
                packet.ReadByte(); // Unknown
                packet.ReadByte(); // Unknown
                packet.ReadByte(); // Unknown

                packet.ReadUInt(); // Walking speed
                packet.ReadUInt(); // Running speed
                packet.ReadUInt(); // Berserk speed

                int active_skills = packet.ReadByte(); // Buffs count
                Spawns.characters[s_index].buffs = new Spawns.Characters_.Buffs_[100];
                for (int a = 0; a < active_skills; a++)
                {
                    uint skillid = packet.ReadUInt();
                    int buffindex = Skills_Info.skillsidlist.IndexOf(skillid);
                    Spawns.characters[s_index].buffs[a].name = Skills_Info.skillsnamelist[Skills_Info.skillsidlist.IndexOf(skillid)];
                    string type = Skills_Info.skillstypelist[buffindex];
                    Spawns.characters[s_index].buffs[a].tempid = packet.ReadUInt(); // Temp ID
                    if (type.StartsWith("SKILL_EU_CLERIC_RECOVERYA_GROUP") || type.StartsWith("SKILL_EU_BARD_BATTLAA_GUARD") || type.StartsWith("SKILL_EU_BARD_DANCEA") || type.StartsWith("SKILL_EU_BARD_SPEEDUPA_HITRATE"))
                    {
                        packet.ReadByte();
                    }
                }
                string name = packet.ReadAscii();
                Spawns.characters[s_index].charname = name;
                packet.ReadByte(); // Unknown
                Spawns.characters[s_index].JobType = packet.ReadByte(); // Job type
                Spawns.characters[s_index].JobLevel = packet.ReadByte(); // Job level
                int cnt = packet.ReadByte();
                packet.ReadByte();
                if (cnt == 1)
                {
                    packet.ReadUInt();
                }
                packet.ReadByte(); // Unknown
                stall = packet.ReadByte(); // Stall flag
                packet.ReadByte(); // Unknown
                string guild = packet.ReadAscii();// Guild
                Spawns.characters[s_index].guildname = guild;
                if (trade == 1)
                {
                    packet.ReadUShort();
                }
                else
                {
                    packet.ReadUInt(); // Guild ID
                    packet.ReadAscii(); // Grant Name
                    packet.ReadUInt();
                    packet.ReadUInt();
                    packet.ReadUInt();
                    packet.ReadUShort();
                    if (stall == 4)
                    {
                        packet.ReadAscii();
                        packet.ReadUInt();
                        packet.ReadUShort();
                    }
                    else
                    {
                        packet.ReadUShort();
                    }
                }
            }
            catch (Exception ex)
            {

            }
        }
    }
}
