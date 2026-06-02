using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace MerchBot.Data
{
    class Parse
    {
        public static void LoadData()
        {

            GameInfo.LoadShopTabData();
            GameInfo.InitializeTypes();

            string input;
            string[] txt;

            TextReader tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_mobs.txt");
            while ((input = tr.ReadLine()) != null)
            {

                if (input != "" && !input.StartsWith("//"))
                {
                    txt = input.Split(',');
                    Mobs_Info.mobsidlist.Add(Convert.ToUInt32(txt[0]));
                    Mobs_Info.mobstypelist.Add(txt[1]);
                    Mobs_Info.mobsnamelist.Add(txt[2]);
                    Mobs_Info.mobslevellist.Add(Convert.ToByte(txt[3]));
                    Mobs_Info.mobshplist.Add(Convert.ToUInt32(txt[4]));
                }
            }
            tr.Close();



            tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_exp.txt");

            while ((input = tr.ReadLine()) != null)
            {
                if (input != "" && !input.StartsWith("//"))
                {
                    txt = input.Split(',');
                    MainData.explist.Add(txt[0]);

                }
            }
            tr.Close();


            //Load items begin
            tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_items.txt");
            while ((input = tr.ReadLine()) != null)
            {
                if (input != "" && !input.StartsWith("//"))
                {
                    txt = input.Split(',');
                    Items_Info.itemsidlist.Add(Convert.ToUInt32(txt[0]));
                    Items_Info.itemstypelist.Add(txt[1]);
                    if (txt[1].StartsWith("ITEM_ETC_COS_HP_POTION"))
                    {
                        Program.main.HorseHpType.Items.Add(txt[2]);
                    }
                    if (txt[1].StartsWith("ITEM_COS_P_CURE_ALL_"))
                    {
                        Program.main.HorseTypePill.Items.Add(txt[2]);
                    }
                    if (txt[1].StartsWith("ITEM_ETC_TRADE_CH") || txt[1].StartsWith("ITEM_ETC_TRADE_WC") || txt[1].StartsWith("ITEM_ETC_TRADE_KT") || txt[1].StartsWith("ITEM_ETC_TRADE_CA") || txt[1].StartsWith("ITEM_ETC_TRADE_EU") || txt[1].StartsWith("ITEM_ETC_TRADE_SD"))
                    {
                        Program.main.TransportGoods.Items.Add(txt[2]);
                    }


                    Items_Info.itemsnamelist.Add(txt[2]);
                    Items_Info.itemslevellist.Add(Convert.ToByte(txt[3]));
                    Items_Info.items_maxlist.Add(Convert.ToUInt16(txt[4]));
                    Items_Info.itemsdurabilitylist.Add(Convert.ToUInt32(txt[5]));
                    Items_Info.itemsClass_Alist.Add(Convert.ToByte(txt[6]));
                    Items_Info.itemsClass_Dlist.Add(Convert.ToByte(txt[7]));
                    Items_Info.itemsClass_Blist.Add(Convert.ToByte(txt[8]));
                    Items_Info.itemsClass_Clist.Add(Convert.ToByte(txt[9]));

                }
            }
            tr.Close();
            //Load items end
            //Load skill begin
            tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_skills.txt");
            while ((input = tr.ReadLine()) != null)
            {
                if (input != "" && !input.StartsWith("//"))
                {
                    txt = input.Split(',');
                    Skills_Info.skillsidlist.Add(Convert.ToUInt32(txt[0]));
                    Skills_Info.skillstypelist.Add(txt[1]);
                    Skills_Info.skillsnamelist.Add(txt[2]);
                    Skills_Info.skillstypeactivelist.Add(Convert.ToByte(txt[3]));
                    Skills_Info.skillsNextSkilllist.Add(Convert.ToInt32(txt[4]));
                    Skills_Info.skillsCastingTimelist.Add(Convert.ToInt32(txt[5]));
                    Skills_Info.skillsreUseTimelist.Add(Convert.ToInt32(txt[6]));
                    Skills_Info.skillsAttackTimelist.Add(Convert.ToInt32(txt[7]));
                    Skills_Info.skillsMasterylist.Add(Convert.ToInt32(txt[8]));
                    Skills_Info.skillsSkillPointlist.Add(Convert.ToInt32(txt[9]));
                    Skills_Info.skillsWeapon1list.Add(Convert.ToInt32(txt[10]));
                    Skills_Info.skillsWeapon2list.Add(Convert.ToInt32(txt[11]));
                    Skills_Info.skillsmpreqlist.Add(Convert.ToInt32(txt[12]));
                    Skills_Info.skillsParam2list.Add(Convert.ToInt32(txt[13]));
                    Skills_Info.skillsParam3list.Add(Convert.ToInt32(txt[14]));
                    Skills_Info.skillsParam4list.Add(Convert.ToInt32(txt[15]));
                    Skills_Info.skillsParam5list.Add(Convert.ToInt32(txt[16]));
                    Skills_Info.skillsParam6list.Add(Convert.ToInt32(txt[17]));
                    Skills_Info.skillsParam7list.Add(Convert.ToInt32(txt[18]));
                }
            }
            tr.Close();
            //Load skill end
            //Load Shop Begin
            tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_shop.txt");
            while ((input = tr.ReadLine()) != null)
            {
                if (input != "" && !input.StartsWith("//"))
                {
                    txt = input.Split(',');
                    string StoreName = txt[0];
                    for (int i = 0; i < GameInfo.ShopTabData.Length; i++)
                    {
                        if (StoreName.StartsWith(GameInfo.ShopTabData[i].StoreName))
                        {
                            for (int a = 0; a < GameInfo.ShopTabData[i].Tab.Length; a++)
                            {
                                if (GameInfo.ShopTabData[i].Tab[a].TabName == StoreName)
                                {
                                    GameInfo.ShopTabData[i].Tab[a].ItemType[Convert.ToInt32(txt[2])] = txt[1];
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
            }
            tr.Close();
            //Load Shop End

            //Load Magic Option Begin
            tr = new StreamReader(Environment.CurrentDirectory + @"\data\parse_magicoption.txt");
            while ((input = tr.ReadLine()) != null)
            {
                if (input != "" && !input.StartsWith("//"))
                {
                    txt = input.Split(',');
                    GameInfo.magicoptionsidlist.Add(Convert.ToInt32(txt[0]));
                    GameInfo.magicoptionsnamelist.Add(txt[1]);
                    GameInfo.magicoptionstypelist.Add(txt[2]);
                    GameInfo.magicoptionslevellist.Add(Convert.ToInt32(txt[3]));
                    GameInfo.magicoptionsOptionPercentlist.Add(Convert.ToDouble(txt[4]));
                    GameInfo.magicoptionsminvallist.Add(Convert.ToInt32(txt[5]));
                    GameInfo.magicoptionsmaxvallist.Add(Convert.ToInt32(txt[6]));
                }
            }
            tr.Close();
            //Load Magic Option End

        }

    }
}
