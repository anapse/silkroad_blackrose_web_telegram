using Framework;
using SR_PROXY.ENGINES;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SR_PROXY.PACKETHANDLERS
{
    public static class Items_Info
    {
        public static List<uint> itemsidlist = new List<uint>();
        public static List<string> itemstypelist = new List<string>();
        public static List<string> itemsnamelist = new List<string>();
        public static List<byte> itemslevellist = new List<byte>();
        public static List<ushort> items_maxlist = new List<ushort>();
        public static List<uint> itemsdurabilitylist = new List<uint>();


        public static void InitializeTypes()
        {
            Types.grab_types = new List<string>();
            //Grab Pets
            Types.grab_types.Add("COS_P_SPOT_RABBIT");
            Types.grab_types.Add("COS_P_RABBIT");
            Types.grab_types.Add("COS_P_GGLIDER");
            Types.grab_types.Add("COS_P_MYOWON");
            Types.grab_types.Add("COS_P_SEOWON");
            Types.grab_types.Add("COS_P_RACCOONDOG");
            Types.grab_types.Add("COS_P_CAT");
            Types.grab_types.Add("COS_P_BROWNIE");
            Types.grab_types.Add("COS_P_PINKPIG");
            Types.grab_types.Add("COS_P_GOLDPIG");
            Types.grab_types.Add("COS_P_FOX");
            //Grab Pets

            Types.attack_types = new List<string>();
            //Attack Pets
            Types.attack_types.Add("COS_P_BEAR");
            Types.attack_types.Add("COS_P_FOX");
            Types.attack_types.Add("COS_P_PENGUIN");
            Types.attack_types.Add("COS_P_WOLF_WHITE_SMALL");
            Types.attack_types.Add("COS_P_WOLF_WHITE");
            Types.attack_types.Add("COS_P_WOLF");
            //Attack Pets

            //Attack Pets Item
            Types.attack_spawn_types = new List<string>();
            Types.attack_spawn_types.Add("ITEM_COS_P_FOX_SCROLL");
            Types.attack_spawn_types.Add("ITEM_COS_P_BEAR_SCROLL");
            Types.attack_spawn_types.Add("ITEM_COS_P_FLUTE");
            Types.attack_spawn_types.Add("ITEM_COS_P_FLUTE_SILK");
            Types.attack_spawn_types.Add("ITEM_COS_P_FLUTE_WHITE");
            Types.attack_spawn_types.Add("ITEM_COS_P_FLUTE_WHITE_SMALL");
            Types.attack_spawn_types.Add("ITEM_COS_P_PENGUIN_SCROLL");
            //Attack Pets Item

            //Grab Pets Item
            Types.grabpet_spawn_types = new List<string>();
            Types.grabpet_spawn_types.Add("ITEM_COS_P_SPOT_RABBIT_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_RABBIT_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_RABBIT_SCROLL_SILK");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_GGLIDER_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_MYOWON_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_SEOWON_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_RACCOONDOG_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_BROWNIE_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_CAT_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_PINKPIG_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_GOLDPIG_SCROLL");
            Types.grabpet_spawn_types.Add("ITEM_COS_P_GOLDPIG_SCROLL_SILK");
            //Grab Pets Item
        }

        public static UInt32 String_To_UInt32(string s)
        {
            char[] arr = s.ToCharArray();
            string a = "0000" + arr[2] + arr[3] + arr[0] + arr[1];
            UInt32 aa = UInt32.Parse(a, System.Globalization.NumberStyles.HexNumber);
            return aa;
        }
        public static void LoadItemsData()
        {
            UTILS.WriteLine ("Loading Silkroad Data");
            try
            {

                string input;
                string[] txt;

                TextReader tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_items.txt");
                while ((input = tr.ReadLine()) != null)
                {
                    if (input != "" && !input.StartsWith("//"))
                    {
                        txt = input.Split(',');
                        Items_Info.itemsidlist.Add(String_To_UInt32(txt[0]));
                        Items_Info.itemstypelist.Add(txt[1]);
                        Items_Info.itemsnamelist.Add(txt[2]);
                        Items_Info.itemslevellist.Add(Convert.ToByte(txt[3]));
                        Items_Info.items_maxlist.Add(Convert.ToUInt16(txt[4]));
                        Items_Info.itemsdurabilitylist.Add(Convert.ToUInt32(txt[5]));
                        //UTILS.WriteLine("Item Added");
                    }
                }



                InitializeTypes();
            }
            catch (Exception a) { UTILS.WriteLine("err"); }
        }
    }
    class Character
    {

        #region Data
        public static Packet CharPacket;
        public static byte[] skip_charid;
        public struct CAVE_
        {
            public bool char_incave;
            public byte xsector;
            public float zcoord;
            public float xcoord;
        }
        public static CAVE_ cave = new CAVE_();
        public static List<string> explist = new List<string>();
        public static int Level;
        public static int maxLevel;
        public static ulong exp;
        public static ulong expmax;
        public static ulong Gold;
        public static uint SkillPoints;
        public static uint AvailableStatPoints;
        public static byte Zerk;
        public static uint CurrentHP;
        public static uint CurrentMP;
        public static byte itemscount;
        public static byte inventoryslot;
        public static byte questspending;
        public static ushort questscompleted;
        public static uint ID;
        public static uint AccountID;
        public static int X;
        public static int Y;
        public static string PlayerName;
        public static string guildName;
        public static ushort STR;
        public static ushort INT;
        public static uint MaxHP;
        public static uint MaxMP;
        public static uint some;
        public static uint model;
        public static byte volh;
        public static float speed;
        public static byte data_loaded = 0;
        public static System.Timers.Timer time = new System.Timers.Timer();
        #endregion
        public struct Types_
        {
            public List<string> grab_types;
            public List<string> grabpet_spawn_types;
            public List<string> attack_types;
            public List<string> attack_spawn_types;
        }
        public static Types_ Types = new Types_();

        public static void CharData(Packet packet)
        {
            try
            {
                #region Reset Data
                //Char_Data.inventorycount.Clear();
                //Char_Data.inventoryid.Clear();
                //Char_Data.inventoryslot.Clear();
                //Char_Data.inventorytype.Clear();
                //Char_Data.inventorydurability.Clear();

                //Char_Data.storageid.Clear();
                //Char_Data.storagetype.Clear();
                //Char_Data.storagecount.Clear();
                //Char_Data.storageslot.Clear();
                //Char_Data.storagedurability.Clear();

                //Globals.MainWindow.inventory_list.Items.Clear();
                //Globals.MainWindow.storage_list.Items.Clear();
                //Char_Data.skillid.Clear();
                //Char_Data.skillname.Clear();
                //Char_Data.skilltype.Clear();
                //Char_Data.skillnamewaiting.Clear();
                //Char_Data.skillonid.Clear();
                //Char_Data.skillontemp.Clear();
                //Char_Data.skillontype.Clear();

                //Globals.MainWindow.skills_list.Items.Clear();
                //Char_Data.char_horseid = 0;
                //Char_Data.storageopened = 0;

                //for (int i = 0; i < Skills_Info.skillsstatuslist.Count; i++)
                //{
                //    Skills_Info.skillsstatuslist[i] = 0;
                //}

                #endregion
                #region Main
                Character.some = packet.ReadUInt32();
                Character.model = packet.ReadUInt32(); //Model
                Character.volh = packet.ReadUInt8(); //Volume and Height
                Character.Level = packet.ReadUInt8();
                Character.maxLevel = packet.ReadUInt8();
                int maxlvl = (int)Character.Level - 1;
                Character.expmax = Convert.ToUInt64(Character.explist[maxlvl]);
                Character.exp = packet.ReadUInt64();
                packet.ReadUInt16(); //SP bar
                packet.ReadUInt16(); //Unknown
                Character.Gold = packet.ReadUInt64();
                Character.SkillPoints = packet.ReadUInt32();
                Character.AvailableStatPoints = packet.ReadUInt16();
                Character.Zerk = packet.ReadUInt8();
                packet.ReadUInt32();
                Character.CurrentHP = packet.ReadUInt32();
                Character.CurrentMP = packet.ReadUInt32();
                packet.ReadUInt8(); //Unknown
                packet.ReadUInt8(); //Unknown
                packet.ReadUInt64(); //Unknown
                #endregion
                #region Items
                Character.inventoryslot = packet.ReadUInt8();
                Character.itemscount = packet.ReadUInt8();
                for (int y = 0; y < Character.itemscount; y++)
                {
                    byte slot = packet.ReadUInt8();
                    packet.ReadUInt32(); // 0 - Unknown
                    uint item_id = packet.ReadUInt32();
                    int index = Items_Info.itemsidlist.IndexOf(item_id);
                    string type = Items_Info.itemstypelist[index];
                    string name = Items_Info.itemsnamelist[index];
                    //Char_Data.inventoryslot.Add(slot);
                    //Char_Data.inventorytype.Add(type);
                    //Char_Data.inventoryid.Add(item_id);
                    //Globals.MainWindow.inventory_list.Items.Add(name);
                    if (type.StartsWith("ITEM_CH") || type.StartsWith("ITEM_EU") || type.StartsWith("ITEM_MALL_AVATAR") || type.StartsWith("ITEM_ETC_E060529_GOLDDRAGONFLAG") || type.StartsWith("ITEM_EVENT_CH") || type.StartsWith("ITEM_EVENT_EU") || type.StartsWith("ITEM_EVENT_AVATAR_W_NASRUN") || type.StartsWith("ITEM_EVENT_AVATAR_M_NASRUN"))
                    {
                        byte item_plus = packet.ReadUInt8();
                        packet.ReadUInt64();
                        packet.ReadUInt32();//Char_Data.inventorydurability.Add(
                        byte blueamm = packet.ReadUInt8();
                        for (int i = 0; i < blueamm; i++)
                        {
                            packet.ReadUInt32();
                            packet.ReadUInt32();
                        }
                        packet.ReadUInt8(); //Unknwon
                        packet.ReadUInt8(); //Unknwon
                        packet.ReadUInt8(); //Unknwon
                        byte flag1 = packet.ReadUInt8(); // Flag ?
                        if (flag1 == 1)
                        {
                            packet.ReadUInt8(); //Unknown
                            packet.ReadUInt32(); // Unknown ID ? ADV Elexir ID ?
                            packet.ReadUInt32(); // Unknwon Count
                        }
                        //Char_Data.inventorycount.Add(1);
                    }
                    else if ((type.StartsWith("ITEM_COS") && type.Contains("SILK")) || (type.StartsWith("ITEM_EVENT_COS") && !type.Contains("_C_")))
                    {
                        byte flag = packet.ReadUInt8();
                        if (flag == 2 || flag == 3 || flag == 4)
                        {
                            packet.ReadUInt32(); //Model
                            packet.ReadAscii();
                            packet.ReadUInt8();
                            if (Types.attack_spawn_types.IndexOf(type) == -1)
                            {
                                packet.ReadUInt32();
                            }
                        }
                        //Char_Data.inventorycount.Add(1);
                        //Char_Data.inventorydurability.Add(0);
                    }
                    else if (Types.grabpet_spawn_types.IndexOf(type) != -1 || Types.attack_spawn_types.IndexOf(type) != -1)
                    {
                        byte flag = packet.ReadUInt8();
                        if (flag == 2 || flag == 3 || flag == 4)
                        {
                            packet.ReadUInt32(); //Model
                            packet.ReadAscii();
                            if (Types.attack_spawn_types.IndexOf(type) == -1)
                            {
                                packet.ReadUInt32();
                            }
                            packet.ReadUInt8();
                        }
                        //Char_Data.inventorycount.Add(1);
                        //Char_Data.inventorydurability.Add(0);
                    }
                    else if (type == "ITEM_ETC_TRANS_MONSTER")
                    {
                        packet.ReadUInt32();
                        //Char_Data.inventorycount.Add(1);
                        //Char_Data.inventorydurability.Add(0);
                    }
                    else if (type.StartsWith("ITEM_MALL_MAGIC_CUBE"))
                    {
                        packet.ReadUInt32();
                        //Char_Data.inventorycount.Add(1);
                        //Char_Data.inventorydurability.Add(0);
                    }
                    else
                    {
                        ushort count = packet.ReadUInt16();
                        if (type.Contains("ITEM_ETC_ARCHEMY_ATTRSTONE") || type.Contains("ITEM_ETC_ARCHEMY_MAGICSTONE"))
                        {
                            packet.ReadUInt8();
                        }
                        //Char_Data.inventorycount.Add(count);
                        //Char_Data.inventorydurability.Add(0);
                    }
                }
                //ItemsCount.CountManager();
                #endregion
                #region Avatars
                packet.ReadUInt8(); // Avatars Max
                int avatarcount = packet.ReadUInt8();
                for (int i = 0; i < avatarcount; i++)
                {
                    packet.ReadUInt8(); //Slot
                    packet.ReadUInt32();
                    uint avatar_id = packet.ReadUInt32();
                    int index = Items_Info.itemsidlist.IndexOf(avatar_id);
                    string type = Items_Info.itemstypelist[index];
                    byte item_plus = packet.ReadUInt8();
                    packet.ReadUInt64();
                    packet.ReadUInt32();
                    byte blueamm = packet.ReadUInt8();
                    for (int a = 0; a < blueamm; a++)
                    {
                        packet.ReadUInt32();
                        packet.ReadUInt32();
                    }
                    packet.ReadUInt32();
                }
                #endregion
                packet.ReadUInt8(); //Avatars End

                int mastery = packet.ReadUInt8(); // Mastery Start
                while (mastery == 1)
                {
                    packet.ReadUInt32(); // Mastery ID
                    packet.ReadUInt8();  // Mastery LV
                    mastery = packet.ReadUInt8(); // New Mastery Start / List End
                }
                packet.ReadUInt8(); // Mastery END

                int skilllist = packet.ReadUInt8(); // Skill List Start
                while (skilllist == 1)
                {
                    uint skillid = packet.ReadUInt32(); // Skill ID
                    packet.ReadUInt8();
                    skilllist = packet.ReadUInt8(); // New Skill Start / List End

                    Char_Data.skillid.Add(skillid);
                    int index = Skills_Info.skillsidlist.IndexOf(skillid);
                    Char_Data.skillname.Add(Skills_Info.skillsnamelist[index]);
                    Char_Data.skilltype.Add(Skills_Info.skillstypelist[index]);
                    Globals.MainWindow.skills_list.Items.Add(Skills_Info.skillsnamelist[index]);
                }

                #region Skipping Quest Part
                byte[] tempe = new byte[4];
                while (true)
                {
                    tempe[0] = tempe[1];
                    tempe[1] = tempe[2];
                    tempe[2] = tempe[3];
                    tempe[3] = packet.ReadUInt8();
                    if ((tempe[0] == skip_charid[0]) && (tempe[1] == skip_charid[1]) && (tempe[2] == skip_charid[2]) && (tempe[3] == skip_charid[3]))
                    {
                        Console.Beep();
                        packet.pointer -= 4;
                        break;
                    }
                }
                #endregion

                Character.ID = packet.ReadUInt32();
                byte xsec = packet.ReadUInt8();
                byte ysec = packet.ReadUInt8();
                float xcoord = packet.ReadSingle();
                float zcoord = packet.ReadSingle();
                float ycoord = packet.ReadSingle();
                if (ysec == 0x80)
                {
                    cave.char_incave = true;
                    cave.xsector = xsec;
                    cave.zcoord = zcoord;
                    cave.xcoord = xcoord;
                }
                else
                {
                    cave.char_incave = false;
                }
                Character.X = Action.CalculatePositionX(xsec, xcoord);
                Character.Y = Action.CalculatePositionY(ysec, ycoord);
                packet.ReadUInt16(); // Position
                int move = packet.ReadUInt8(); // Move ?? Maybie Useless
                packet.ReadUInt8(); // Run
                packet.ReadUInt8();
                packet.ReadUInt16();
                packet.ReadUInt8();
                packet.ReadUInt8(); //DeathFlag
                packet.ReadUInt8(); //Movement Flag
                packet.ReadUInt8(); //Berserker Flag
                packet.ReadUInt32(); //Walking Speed
                Character.speed = packet.ReadSingle(); //Running Speed
                packet.ReadUInt32(); //Berserker Speed
                packet.ReadUInt8();
                Character.PlayerName = packet.ReadAscii();
                packet.ReadAscii(); // ALIAS

                packet.ReadUInt8(); // Job Level
                packet.ReadUInt8(); // Job Type
                packet.ReadUInt32(); // Trader Exp
                packet.ReadUInt32(); // Thief Exp
                packet.ReadUInt32(); // Hunter Exp
                packet.ReadUInt8(); // Trader LV
                packet.ReadUInt8(); // Thief LV
                packet.ReadUInt8(); // Hunter LV
                packet.ReadUInt8(); // PK Flag
                packet.ReadUInt16(); // Unknown
                packet.ReadUInt32(); // Unknown
                packet.ReadUInt16(); // Unknown
                AccountID = packet.ReadUInt32(); // Account ID
                Globals.MainWindow.Text = "zBot | " + Character.PlayerName + " | " + Globals.MainWindow.in_game_server_name.Text;
                Globals.MainWindow.tray.Text = "zBot | " + Character.PlayerName + " | " + Globals.MainWindow.in_game_server_name.Text;
                if (data_loaded == 0)
                {
                    Globals.MainWindow.config_button.Enabled = true;
                    data_loaded = 1;
                    BotData.Statistic.sp_begin = (int)Character.SkillPoints;
                    BotData.Statistic.gold_begin = (long)Character.Gold;
                    Configs.ReadConfigs();
                    Globals.MainWindow.start_button.Enabled = true;
                    if (Char_Data.f_wep_name != "" && Char_Data.f_wep_name != null)
                    {
                        int index = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                        if (index == -1)
                        {
                            Char_Data.f_wep_name = "";
                        }
                    }
                    if (Char_Data.s_wep_name != "" && Char_Data.s_wep_name != null)
                    {
                        int index = Char_Data.inventorytype.IndexOf(Char_Data.s_wep_name);
                        if (index == -1)
                        {
                            Char_Data.s_wep_name = "";
                        }
                    }
                    System.Threading.Thread time_thread = new Thread(StartTimer);
                    time_thread.Start();
                }
                for (int i = 0; i < Globals.MainWindow.buffs_list2.Items.Count; i++)
                {
                    Char_Data.skillnamewaiting.Add(Globals.MainWindow.buffs_list2.Items[i].ToString());
                    Char_Data.skilltipwaiting.Add(2);
                    Buffas.buff_waiting = true;
                }
                for (int i = 0; i < Globals.MainWindow.buffs_list1.Items.Count; i++)
                {
                    Char_Data.skillnamewaiting.Add(Globals.MainWindow.buffs_list1.Items[i].ToString());
                    Char_Data.skilltipwaiting.Add(1);
                    Buffas.buff_waiting = true;
                }
                Globals.Debug("CharData", " Char ID: " + skip_charid[0].ToString("X2") + skip_charid[1].ToString("X2") + skip_charid[2].ToString("X2") + skip_charid[3].ToString("X2"), packet);

            }
            catch (Exception ex) { UTILS.WriteLine($"Error in 0x3015 ! {ex.ToString()}"); }
        }


    }
}
