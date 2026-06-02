using MerchBot.SecurityAPI;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MerchBot.Data;
using MerchBot.InventoryUpdate;
using MerchBot.Stat;

namespace MerchBot.Spawn
{
    class CharacterSpawn
    {
        public static void Character(Packet packet)
        {

            packet.ReadUInt();
            packet.ReadUInt();
            packet.ReadUInt();
            packet.ReadUInt();

            MainData.PhyDef = packet.ReadUShort();//Phy def
            MainData.MagDef = packet.ReadUShort();//Mag def
            MainData.HitRate = packet.ReadUShort();//Hit rate
            MainData.ParryRatio = packet.ReadUShort();//parry ratio

            MainData.MaxHP = packet.ReadUInt();//HP
            MainData.MaxMP = packet.ReadUInt();//MP
            MainData.Str = packet.ReadUShort();//STR
            MainData.Int = packet.ReadUShort();//İNT

            if (MainData.CurrentMP > MainData.MaxMP)
            {
                MainData.CurrentMP = MainData.MaxMP;
            }
            if (MainData.CurrentHP > MainData.MaxHP)
            {
                MainData.CurrentHP = MainData.MaxHP;
            }
            Program.main.mp_bar.Maximum = (int)MainData.MaxMP;
            Program.main.mp_bar.Value = (int)MainData.CurrentMP;
            Program.main.hp_bar.Maximum = (int)MainData.MaxHP;
            Program.main.hp_bar.Value = (int)MainData.CurrentHP;
            Program.main.exp_bar.Maximum = 100;
            Program.main.exp_bar.Value = Convert.ToInt32(MainData.PercentExp);
            MainData.dead = false;
            Program.main.refreshCharStatsAndProgress();
        }

        public static void HandleMainData(Packet packet)
        {
            try
            {
                packet.ReadUInt();
                uint model = packet.ReadUInt();
                if (!(model >= 1907 && model <= 1932))
                {
                    //euro
                    MainData.EuOrNot = true;

                }
                else
                {
                    MainData.EuOrNot = false;

                }
                packet.ReadByte();
                MainData.Level = packet.ReadByte();
                MainData.MaxLevel = packet.ReadByte();
                int maxlvl = MainData.Level - 1;
                MainData.MaxExp = Convert.ToUInt64(MainData.explist[maxlvl]);
                MainData.Exp = packet.ReadULong();
                MainData.PercentExp = (MainData.Exp * 100) / MainData.MaxExp;
                uint spxp1 = packet.ReadUShort(); //SP XP
                uint spxp2 = packet.ReadUShort();
                MainData.Gold = packet.ReadULong();
                MainData.SkillPoints = packet.ReadUInt();
                MainData.StatPoints = packet.ReadUShort();
                packet.ReadByte();//Zerk quantity
                packet.ReadUInt();
                MainData.CurrentHP = packet.ReadUInt();

                MainData.CurrentMP = packet.ReadUInt();

                packet.ReadByte(); //Unknown
                packet.ReadByte(); //Unknown
                packet.ReadULong(); //Unknown   
                MainData.InventorySlotCount = packet.ReadByte();
                MainData.itemscount = packet.ReadByte();
                //Inventory Begin
                for (int i = 0; i < MainData.itemscount; i++)
                {
                    byte slot = packet.ReadByte();
                    packet.ReadUInt(); // 0 - Unknown
                    uint item_id = packet.ReadUInt();
                    int index = Items_Info.itemsidlist.IndexOf(item_id);
                    if (index > -1)
                    {
                        string type = Items_Info.itemstypelist[index];
                        string name = Items_Info.itemsnamelist[index];
                        byte Class_B = Items_Info.itemsClass_Blist[index];
                        MainData.inventoryslot.Add(slot);
                        MainData.inventorytype.Add(type);
                        MainData.inventoryid.Add(item_id);
                        if (slot != 0 && slot != 1 && slot != 2 && slot != 3 && slot != 4 && slot != 5 && slot != 6 && slot != 7 && slot != 8 && slot != 9 && slot != 10 && slot != 11 && slot != 12)
                        {
                            Program.main.inventory_list.Items.Add(name);//Listbox
                        }


                        if (type.StartsWith("ITEM_CH") || type.StartsWith("ITEM_EU") || type.StartsWith("ITEM_MALL_AVATAR") || type.StartsWith("ITEM_ETC_E060529_GOLDDRAGONFLAG") || type.StartsWith("ITEM_EVENT_CH") || type.StartsWith("ITEM_EVENT_EU") || type.StartsWith("ITEM_EVENT_AVATAR_W_NASRUN") || type.StartsWith("ITEM_EVENT_AVATAR_M_NASRUN"))
                        {
                            byte item_plus = packet.ReadByte();
                            ulong variance = packet.ReadULong();
                            byte ItemClass = Stat.ReadWhiteStat.GetItemType(Class_B);
                            if (ItemClass != 4)
                            {
                                Stat.ReadWhiteStat.WhiteStatRead(variance, ItemClass, type, item_id, name, item_plus);//White Stat Read
                            }
                            MainData.inventorydurability.Add(packet.ReadUInt());
                            MainData.BlueCount = packet.ReadByte();
                            string[] BlueID = new string[MainData.BlueCount];
                            string[] BlueValue = new string[MainData.BlueCount];

                            for (int a = 0; a < MainData.BlueCount; a++)
                            {
                                BlueID[a] = packet.ReadUInt().ToString();
                                BlueValue[a] = packet.ReadUInt().ToString();
                            }

                            AddBlueStat.AddBlue(BlueID, BlueValue, item_id, type, name, ItemClass, slot);//Blue Stat Read

                            packet.ReadByte(); //Unknwon
                            packet.ReadByte(); //Unknwon
                            packet.ReadByte(); //Unknwon
                            byte flag1 = packet.ReadByte(); // Flag 
                            if (flag1 == 1)
                            {
                                packet.ReadByte(); //Unknown
                                packet.ReadUInt(); // Unknown
                                packet.ReadUInt(); // Unknwon
                            }
                            MainData.inventorycount.Add(1);
                        }
                        else if ((type.StartsWith("ITEM_COS") && type.Contains("SILK")) || (type.StartsWith("ITEM_EVENT_COS") && !type.Contains("_C_")))
                        {
                            byte flag = packet.ReadByte();
                            if (flag == 2 || flag == 3 || flag == 4)
                            {
                                packet.ReadUInt(); //Model
                                packet.ReadAscii();
                                packet.ReadByte();
                                if (GameInfo.Types.attack_spawn_types.IndexOf(type) == -1)
                                {
                                    packet.ReadUInt();
                                }
                            }
                            MainData.inventorycount.Add(1);
                            MainData.inventorydurability.Add(0);
                        }
                        else if (GameInfo.Types.grabpet_spawn_types.IndexOf(type) != -1 || GameInfo.Types.attack_spawn_types.IndexOf(type) != -1)
                        {
                            byte flag = packet.ReadByte();
                            if (flag == 2 || flag == 3 || flag == 4)
                            {
                                packet.ReadUInt(); //Model
                                packet.ReadAscii();
                                if (GameInfo.Types.attack_spawn_types.IndexOf(type) == -1)
                                {
                                    packet.ReadUInt();
                                }
                                packet.ReadByte();
                            }
                            MainData.inventorycount.Add(1);
                            MainData.inventorydurability.Add(0);
                        }
                        else if (type == "ITEM_ETC_TRANS_MONSTER")
                        {
                            packet.ReadUInt();
                            MainData.inventorycount.Add(1);
                            MainData.inventorydurability.Add(0);
                        }
                        else if (type.StartsWith("ITEM_MALL_MAGIC_CUBE"))
                        {
                            packet.ReadUInt();
                            MainData.inventorycount.Add(1);
                            MainData.inventorydurability.Add(0);
                        }
                        else
                        {
                            ushort count = packet.ReadUShort();
                            if (type.Contains("ITEM_ETC_ARCHEMY_ATTRSTONE")) // || type.Contains("ITEM_ETC_ARCHEMY_MAGICSTONE"))
                            {
                                packet.ReadByte();
                            }
                            MainData.inventorycount.Add(count);
                            MainData.inventorydurability.Add(0);
                        }
                    }
                }
                int search = MainData.inventoryslot.IndexOf(8);//8 Slot Check
                if (search != -1)
                {
                    MainData.Job = true;//Character Wear Job Suits Or Not  - 8 Slot Contains Suits
                }
                else
                {
                    MainData.Job = false;
                }
                //İnventory End

                //Avatar Begin
                packet.ReadByte(); // Avatars Max // 05
                int avatarcount = packet.ReadByte();
                for (int i = 0; i < avatarcount; i++)
                {
                    uint slot = packet.ReadByte(); //Slot
                    packet.ReadUInt();
                    uint avatar_id = packet.ReadUInt();
                    int index = Items_Info.itemsidlist.IndexOf(avatar_id);
                    if (index > -1)
                    {
                        string type = Items_Info.itemstypelist[index];
                        string name = Items_Info.itemsnamelist[index];
                        MainData.avataryslot.Add(slot);
                        MainData.avatartype.Add(type);
                        MainData.avatarid.Add(avatar_id);
                    }

                    byte item_plus = packet.ReadByte();
                    packet.ReadULong();
                    packet.ReadUInt();
                    byte blueamm = packet.ReadByte();
                    for (int a = 0; a < blueamm; a++)
                    {
                        packet.ReadUInt();
                        packet.ReadUInt();
                    }
                    packet.ReadUInt();
                }
                packet.ReadByte();
                //Avatar End

                int mastery = packet.ReadByte(); // Mastery Start
                while (mastery == 1)
                {
                    packet.ReadUInt(); // Mastery ID
                    packet.ReadByte();  // Mastery LV
                    mastery = packet.ReadByte(); // New Mastery Start / List End
                }
                packet.ReadByte(); // Mastery END

                uint skilllist = packet.ReadByte(); // Skill List Start                                                 
                while (skilllist == 1)
                {
                    uint skillid = packet.ReadUInt(); // Skill ID
                    packet.ReadByte();
                    skilllist = packet.ReadByte(); // New Skill Start / List End
                    ADDSkill(skillid);//AddSkill to Listbox
                }
                //Skill List End

                //Quest Start
                Packet MainDataid = new Packet(3020);
                MainDataid.WriteUInt(MainData.UniqueID);
                MainDataid.Lock();
                byte idpart1 = MainDataid.ReadByte();
                byte idpart2 = MainDataid.ReadByte();
                byte idpart3 = MainDataid.ReadByte();
                byte idpart4 = MainDataid.ReadByte();
                while (true)
                {
                    if (packet.ReadByte() == idpart1)
                    {
                        if (packet.ReadByte() == idpart2)
                        {
                            if (packet.ReadByte() == idpart3)
                            {
                                if (packet.ReadByte() == idpart4)
                                {
                                    break;
                                }
                            }
                        }
                    }
                }
                //Quest End
                MainData.Xsec = packet.ReadByte();
                MainData.Ysec = packet.ReadByte();

                float xcoord = packet.ReadFloat();
                float zcoord = packet.ReadFloat();
                float ycoord = packet.ReadFloat();
                MainData.XCoord = ((int)MainData.Xsec - 135) * 192 + (int)xcoord / 10;
                MainData.YCoord = ((int)MainData.Ysec - 92) * 192 + (int)ycoord / 10;
                packet.ReadUShort(); // Position
                packet.ReadByte();
                packet.ReadByte(); // Run
                packet.ReadByte();
                packet.ReadUShort();
                packet.ReadByte();
                packet.ReadByte(); //DeathFlag
                packet.ReadByte(); //Movement Flag
                packet.ReadByte(); //Berserker Flag
                MainData.WalkSpeed = packet.ReadFloat() * 1.1f; //Walking Speed
                MainData.RunSpeed = packet.ReadFloat() * 1.1f; //Running Speed
                MainData.ZerkSpeed = packet.ReadUInt() * 1.1f; //Berserker Speed
                packet.ReadByte();
                MainData.PlayerName = packet.ReadAscii();
                Program.main.Text = "MerchBot [" + MainData.PlayerName + "]";
                MainData.alias = packet.ReadAscii(); // ALIAS
                MainData.Joblevel = packet.ReadByte(); // job level
                byte Jobtype = packet.ReadByte();
                if (Jobtype == 1)
                {
                    MainData.JobType = "Trader";
                }
                else if (Jobtype == 2)
                {
                    MainData.JobType = "Thief";
                }
                else if (Jobtype == 3)
                {
                    MainData.JobType = "Hunter";
                }
                // job type
                MainData.TraderExp = packet.ReadUInt(); // trader exp
                MainData.ThiefExp = packet.ReadUInt(); // thief exp
                MainData.HunterExp = packet.ReadUInt(); // hunter exp
                MainData.TraderLv = packet.ReadByte(); // trader lv
                MainData.ThiefLv = packet.ReadByte(); // thief lv
                MainData.HunterLv = packet.ReadByte(); // hunter lv
                packet.ReadByte();//pk flag
                packet.ReadUShort();// Unknown
                packet.ReadUInt();// Unknown
                packet.ReadUShort();// Unknown
                MainData.AccountID = packet.ReadUInt();//Accaount ID             
            }
            catch (Exception ex)
            {

                Program.main.listBox1.Items.Add("HandleMainData" + ex);
            }

        }

        public static void ADDSkill(uint id)
        {
            try
            {
                MainData.skillid.Add(id);
                int index = Skills_Info.skillsidlist.IndexOf(id);
                string name = Skills_Info.skillsnamelist[index];
                string type = Skills_Info.skillstypelist[index];
                int SkillType = Skills_Info.skillstypeactivelist[index];
                int CastingTime = Skills_Info.skillsCastingTimelist[index];
                int reUseTime = Skills_Info.skillsreUseTimelist[index];
                int mpreq = Skills_Info.skillsmpreqlist[index];
                int Param2 = Skills_Info.skillsParam2list[index];
                int Param3 = Skills_Info.skillsParam3list[index];
                MainData.skillname.Add(name);
                MainData.skilltype.Add(type);
                MainData.skillwait.Add(reUseTime);
                MainData.skilllastuse.Add(DateTime.Now.Subtract(TimeSpan.FromMinutes(30)));
                string nameString = Calculate.ASCIIIntToString(Param2);
                if (nameString == "att")//Attack Skill
                {
                    if (SkillType == 2)
                    {
                        Program.main.skills_list_attack.Items.Add(name);
                    }
                }
                else//Buff Or Imbue
                {
                    if (SkillType == 2)
                    {
                        Program.main.skills_list_buff.Items.Add(name);//Buffs
                    }
                    if (Param3 == 5000 || Param3 == 6000 || Param3 == 7000 || Param3 == 8000)
                    {
                        if (SkillType == 1)
                        {
                            Program.main.skills_list_imbue.Items.Add(name);//Imbue
                        }
                    }
                    else
                    {
                        if (SkillType == 1)
                        {
                            Program.main.skills_list_buff.Items.Add(name);//Buffs
                        }
                    }
                }

            }
            catch (Exception ex)
            {

                Program.main.listBox1.Items.Add("ADDSkill" + ex);
            }

        }
    }
}
