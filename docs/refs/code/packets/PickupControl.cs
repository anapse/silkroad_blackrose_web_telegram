using bot.Clases.Controles;
using bot.Clases;
using bot.Clases.infoclass;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using bot.SilkroadSecurityApi;


namespace bot.Clases.Controles
{
    class PickupControl
    {

        public static bool there_is_pickable = false;
        public static uint picking_id = 0;

        public static bool picking = false;
        public static bool picked = false;
        private static void PickItem(uint id)
        {

            if (Data.char_grabpetid != 0)
            {

                Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_PETACTION);
                NewPacket.WriteUInt32(Data.char_grabpetid);
                NewPacket.WriteUInt8(0x08); //Pickup
                NewPacket.WriteUInt32(id);
                Agent.Send(NewPacket);
            }
            else
            {

                if (picked == false)
                {

                    picking = true;
                    Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION);
                    NewPacket.WriteUInt8(0x01);
                    NewPacket.WriteUInt8(0x02);
                    NewPacket.WriteUInt8(0x01);
                    NewPacket.WriteUInt32(id);
                    Agent.Send(NewPacket);
                }
            }
        }

        public static void NormalFilter()
        {


            for (int i = 0; i < Item.PickableItem.Count; i++)
            {

                System.Threading.Thread.Sleep(2);
                if (Item.PickableItem[i].Status == 0 && Item.PickableItem[i].Type != null)
                {
                    string type = Item.PickableItem[i].Type;
                    if (type.StartsWith("ITEM_ETC_GOLD"))
                    {
                        Console.WriteLine("Pic gold");
                        PickItem(Item.PickableItem[i].UniqueID);
                        break;

                    }
                    if (Data.itemscount.items_count < Caracter.InventorySize - 13)
                    {
                        if (type.Contains("RARE") || type.Contains("ITEM_ROC") || type.Contains("ITEM_MALL") || type.Contains("ITEM_QSP") || type.Contains("ITEM_EVENT_CH") || type.Contains("ITEM_EVENT_EU") || type.Contains("ITEM_QNO"))
                        {
                            PickItem(Item.PickableItem[i].UniqueID);
                            break;
                        }
                        if (type.StartsWith("ITEM_CH_SWORD") || type.StartsWith("ITEM_CH_BLADE") || type.StartsWith("ITEM_CH_SPEAR") || type.StartsWith("ITEM_CH_TBLADE") || type.StartsWith("ITEM_CH_BOW") || type.StartsWith("ITEM_CH_SHIELD") || type.StartsWith("ITEM_EU_DAGGER") || type.StartsWith("ITEM_EU_SWORD") || type.StartsWith("ITEM_EU_TSWORD") || type.StartsWith("ITEM_EU_AXE") || type.StartsWith("ITEM_EU_CROSSBOW") || type.StartsWith("ITEM_EU_DARKSTAFF") || type.StartsWith("ITEM_EU_TSTAFF") || type.StartsWith("ITEM_EU_HARP") || type.StartsWith("ITEM_EU_STAFF") || type.StartsWith("ITEM_EU_SHIELD"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_CH_M_HEAVY") || type.StartsWith("ITEM_CH_M_LIGHT") || type.StartsWith("ITEM_CH_M_CLOTHES") || type.StartsWith("ITEM_CH_W_HEAVY") || type.StartsWith("ITEM_CH_W_LIGHT") || type.StartsWith("ITEM_CH_W_CLOTHES") || type.StartsWith("ITEM_EU_M_HEAVY") || type.StartsWith("ITEM_EU_M_LIGHT") || type.StartsWith("ITEM_EU_M_CLOTHES") || type.StartsWith("ITEM_EU_W_HEAVY") || type.StartsWith("ITEM_EU_W_LIGHT") || type.StartsWith("ITEM_EU_W_CLOTHES"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_EU_RING") || type.StartsWith("ITEM_EU_EARRING") || type.StartsWith("ITEM_EU_NECKLACE") || type.StartsWith("ITEM_CH_RING") || type.StartsWith("ITEM_CH_EARRING") || type.StartsWith("ITEM_CH_NECKLACE"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_WEAPON"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_SHIELD"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_ARMOR"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_ACCESSARY"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_AMMO_ARROW"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_AMMO_BOLT"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_SCROLL_RETURN"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_CURE_ALL"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ALL_SPOTION"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ALL_POTION"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_MP_POTION"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_HP_POTION"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                        if (type.StartsWith("ITEM_ETC_ARCHEMY_MAGICTABLET") || type.StartsWith("ITEM_ETC_ARCHEMY_ATTRTABLET") || type.Contains("MAGICSTONE"))
                        {


                            PickItem(Item.PickableItem[i].UniqueID);
                            break;


                        }
                        if (type.StartsWith("ITEM_ETC_ARCHEMY_MATERIAL"))
                        {

                            PickItem(Item.PickableItem[i].UniqueID);
                            break;

                        }
                    }
                }
                if (i + 1 >= Item.PickableItem.Count)
                {
                    System.Threading.Thread.Sleep(1);
                    there_is_pickable = false;

                    LogicControl.Manager();

                }
            }
            if (Item.PickableItem.Count == 0)
            {
                System.Threading.Thread.Sleep(1);
                there_is_pickable = false;
                LogicControl.Manager();

            }
        }

        public static bool Filter(string type)
        {
            if (type.StartsWith("ITEM_ETC_GOLD"))
            {
                foreach (AdvanceItem item in AdvanceItem.Gold)
                {
                    if (item.AdvanceType == type)
                    {
                        if (item.Action != "Ignore" && item.Action != "Drop")
                            return true;
                        break;
                    }
                }
            }
            if (Data.itemscount.items_count < Caracter.InventorySize - 13)
            {
                if (type.Contains("RARE") || type.Contains("ITEM_ROC"))
                {
                    return true;
                }
                else if (type.StartsWith("ITEM_CH_SWORD") || type.StartsWith("ITEM_CH_BLADE") || type.StartsWith("ITEM_CH_SPEAR") || type.StartsWith("ITEM_CH_TBLADE") || type.StartsWith("ITEM_CH_BOW") || type.StartsWith("ITEM_CH_SHIELD") || type.StartsWith("ITEM_EU_DAGGER") || type.StartsWith("ITEM_EU_SWORD") || type.StartsWith("ITEM_EU_TSWORD") || type.StartsWith("ITEM_EU_AXE") || type.StartsWith("ITEM_EU_CROSSBOW") || type.StartsWith("ITEM_EU_DARKSTAFF") || type.StartsWith("ITEM_EU_TSTAFF") || type.StartsWith("ITEM_EU_HARP") || type.StartsWith("ITEM_EU_STAFF") || type.StartsWith("ITEM_EU_SHIELD"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Weapon.Count))
                    {
                        if (AdvanceItem.Weapon[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Weapon[a].Action != "Ignore" && AdvanceItem.Weapon[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_CH_M_HEAVY") || type.StartsWith("ITEM_CH_M_LIGHT") || type.StartsWith("ITEM_CH_M_CLOTHES") || type.StartsWith("ITEM_CH_W_HEAVY") || type.StartsWith("ITEM_CH_W_LIGHT") || type.StartsWith("ITEM_CH_W_CLOTHES") || type.StartsWith("ITEM_EU_M_HEAVY") || type.StartsWith("ITEM_EU_M_LIGHT") || type.StartsWith("ITEM_EU_M_CLOTHES") || type.StartsWith("ITEM_EU_W_HEAVY") || type.StartsWith("ITEM_EU_W_LIGHT") || type.StartsWith("ITEM_EU_W_CLOTHES"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Armor.Count))
                    {
                        if (AdvanceItem.Armor[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Armor[a].Action != "Ignore" && AdvanceItem.Armor[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_EU_RING") || type.StartsWith("ITEM_EU_EARRING") || type.StartsWith("ITEM_EU_NECKLACE") || type.StartsWith("ITEM_CH_RING") || type.StartsWith("ITEM_CH_EARRING") || type.StartsWith("ITEM_CH_NECKLACE"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Accessorise.Count))
                    {
                        if (AdvanceItem.Accessorise[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Accessorise[a].Action != "Ignore" && AdvanceItem.Accessorise[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_WEAPON") || type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_SHIELD") || type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_ARMOR") || type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_ACCESSARY"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Elixir.Count))
                    {
                        if (AdvanceItem.Elixir[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Elixir[a].Action != "Ignore" && AdvanceItem.Elixir[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_ETC_AMMO_ARROW") || type.StartsWith("ITEM_ETC_AMMO_BOLT"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Arrow.Count))
                    {
                        if (AdvanceItem.Arrow[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Arrow[a].Action != "Ignore" && AdvanceItem.Arrow[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_ETC_SCROLL_RETURN"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Return.Count))
                    {
                        if (AdvanceItem.Return[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Return[a].Action != "Ignore" && AdvanceItem.Return[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_ETC_CURE_ALL") || type.StartsWith("ITEM_ETC_ALL_SPOTION") || type.StartsWith("ITEM_ETC_ALL_POTION") || type.StartsWith("ITEM_ETC_MP_POTION") || type.StartsWith("ITEM_ETC_HP_POTION"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Potion.Count))
                    {
                        if (AdvanceItem.Potion[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Potion[a].Action != "Ignore" && AdvanceItem.Potion[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_ETC_ARCHEMY_MAGICTABLET") || type.StartsWith("ITEM_ETC_ARCHEMY_ATTRTABLET") || type.Contains("MAGICSTONE"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Tablet.Count))
                    {
                        if (AdvanceItem.Tablet[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Tablet[a].Action != "Ignore" && AdvanceItem.Tablet[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.StartsWith("ITEM_ETC_ARCHEMY_MATERIAL"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Material.Count))
                    {
                        if (AdvanceItem.Material[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Material[a].Action != "Ignore" && AdvanceItem.Material[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.Contains("ITEM_MALL") || type.Contains("ITEM_EVENT_CH") || type.Contains("ITEM_EVENT_EU"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Mall.Count))
                    {
                        if (AdvanceItem.Mall[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Mall[a].Action != "Ignore" && AdvanceItem.Mall[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else if (type.Contains("ITEM_QSP") || type.Contains("ITEM_QNO"))
                {
                    int a = 0;
                    while ((a < AdvanceItem.Quest.Count))
                    {
                        if (AdvanceItem.Quest[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Quest[a].Action != "Ignore" && AdvanceItem.Quest[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
                else
                {
                    int a = 0;
                    while ((a < AdvanceItem.Allitems.Count))
                    {
                        if (AdvanceItem.Allitems[a].AdvanceType == type)
                        {
                            if (AdvanceItem.Allitems[a].Action != "Ignore" && AdvanceItem.Allitems[a].Action != "Drop")
                                return true;
                            break;
                        }
                        a++;
                    }
                }
            }
            return false;
        }

        public static void AdvanceFilter()
        {
            for (int i = 0; i < Item.PickableItem.Count; i++)
            {
                try
                {
                    System.Threading.Thread.Sleep(2);
                    if (Item.PickableItem[i].Status == 0 && Item.PickableItem[i].Type != null)
                    {
                        string type = Item.PickableItem[i].Type;
                        if (Filter(type) == true)
                        {
                            PickItem(Item.PickableItem[i].UniqueID);
                            break;
                        }
                    }
                    if (i + 1 >= Item.PickableItem.Count)
                    {
                        System.Threading.Thread.Sleep(1);
                        there_is_pickable = false;

                        LogicControl.Manager();

                    }
                }
                catch
                {
                    if (i + 1 >= Item.PickableItem.Count)
                    {
                        System.Threading.Thread.Sleep(1);
                        there_is_pickable = false;

                        LogicControl.Manager();

                    }
                }
            }
            if (Item.PickableItem.Count == 0)
            {
                System.Threading.Thread.Sleep(1);
                there_is_pickable = false;

                LogicControl.Manager();

            }
        }

        public static void Itemfree(Packet packet)
        {

            uint ID = packet.ReadUInt32();
            foreach (Item item in Item.SpawnItem)
            {
                if (item.UniqueID == ID)
                {
                    Item.PickableItem.Add(item);
                    there_is_pickable = true;
                    break;
                }
            }

        }
    }
}

