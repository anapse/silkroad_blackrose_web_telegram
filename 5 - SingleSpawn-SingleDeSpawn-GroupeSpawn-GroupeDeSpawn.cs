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
    class Spawn
    {
        public static void SingleSpawn(Packet packet)
        {
            try
            {
                uint model = packet.ReadUInt();
                int index = Mobs_Info.mobsidlist.IndexOf(model);
                int itemsindex = Items_Info.itemsidlist.IndexOf(model);
                if (itemsindex != -1)
                {
                    #region ItemsParsing
                    Parse.ParseItems(packet, itemsindex);
                    #endregion
                }


                if (index != -1)
                {
                    #region PetsParsing
                    if (Mobs_Info.mobstypelist[index].StartsWith("COS"))
                    {
                        Parse.ParsePets(packet, index);
                    }
                    #endregion
                    #region NPCParsing
                    else if (Mobs_Info.mobstypelist[index].StartsWith("NPC"))
                    {
                        Parse.ParseNPC(packet, index);
                    }
                    #endregion
                    #region CharParsing
                    else if (Mobs_Info.mobstypelist[index].StartsWith("CHAR"))
                    {
                        Parse.ParseChar(packet, index);
                    }
                    #endregion
                    #region MobsParsing
                    else if (Mobs_Info.mobstypelist[index].StartsWith("MOB"))
                    {
                        Parse.ParseMob(packet, index);
                    }
                    #endregion
                    #region PortalParsing
                    else if (Mobs_Info.mobstypelist[index].Contains("_GATE"))
                    {
                        Parse.ParsePortal(packet, index);
                    }
                    #endregion
                    #region OtherParsing
                    else
                    {
                        //Parse.ParseOther(packet, index);
                    }
                    #endregion
                }
            }
            catch (Exception)
            {

                Program.main.listBox1.Items.Add("SingleSpawn Hata");
            }


        }

        public static void GroupeSpawn(Packet packet)
        {
            try
            {

                for (int i = 0; i < MainData.groupespawncount; i++)
                {
                    System.Threading.Thread.Sleep(1);
                    #region DetectType
                    uint model = packet.ReadUInt();
                    int index = Mobs_Info.mobsidlist.IndexOf(model);
                    int itemsindex = Items_Info.itemsidlist.IndexOf(model);

                    #endregion
                    if (itemsindex != -1)
                    {
                        #region ItemsParsing
                        Parse.ParseItems(packet, itemsindex);
                        #endregion
                    }


                    if (index != -1)
                    {
                        #region PetsParsing
                        if (Mobs_Info.mobstypelist[index].StartsWith("COS"))
                        {
                            Parse.ParsePets(packet, index);
                        }
                        #endregion
                        #region NPCParsing
                        else if (Mobs_Info.mobstypelist[index].StartsWith("NPC"))
                        {
                            Parse.ParseNPC(packet, index);
                        }
                        #endregion
                        #region CharParsing
                        else if (Mobs_Info.mobstypelist[index].StartsWith("CHAR"))
                        {
                            Parse.ParseChar(packet, index);
                        }
                        #endregion
                        #region MobsParsing
                        else if (Mobs_Info.mobstypelist[index].StartsWith("MOB"))
                        {
                            Parse.ParseMob(packet, index);
                        }
                        #endregion
                        #region PortalParsing
                        else if (Mobs_Info.mobstypelist[index].Contains("_GATE"))
                        {
                            Parse.ParsePortal(packet, index);
                        }
                        #endregion
                        #region OtherParsing
                        else
                        {
                            //Parse.ParseOther(packet, index);
                        }
                        #endregion

                    }
                }

            }
            catch (Exception)
            {

                Program.main.listBox1.Items.Add("GroupeSpawn Hata");
            }

        }

        public static void SingleDeSpawn(Packet packet)
        {
            uint id = packet.ReadUInt();
            int npcindex = Spawns.npcid.IndexOf(id);

            for (int a = 0; a < Spawns.pets.Length; a++)
            {
                if (Spawns.pets[a].id == id)
                {
                    Spawns.pets[a] = new Spawns.Pets_();
                    break;
                }
            }
            for (int b = 0; b < Spawns.characters.Length; b++)
            {
                if (Spawns.characters[b].id == id)
                {
                    Spawns.characters[b] = new Spawns.Characters_();
                    break;
                }
            }
            for (int z = 0; z < Spawns.mob_id.Count; z++)
            {
                if (Spawns.mob_id[z] == id)
                {
                    Spawns.mob_dist.RemoveAt(z);
                    Spawns.mob_id.RemoveAt(z);
                    Spawns.mob_name.RemoveAt(z);
                    Spawns.mob_priority.RemoveAt(z);
                    Spawns.mob_status.RemoveAt(z);
                    Spawns.mob_type.RemoveAt(z);
                    Spawns.mob_x.RemoveAt(z);
                    Spawns.mob_y.RemoveAt(z);
                    break;
                }
            }
            for (int c = 0; c < Spawns.item_id.Count; c++)
            {
                if (Spawns.item_id[c] == id)
                {
                    Spawns.item_id.RemoveAt(c);
                    Spawns.item_status.RemoveAt(c);
                    Spawns.item_type.RemoveAt(c);
                }
            }
            if (npcindex != -1)
            {
                Spawns.npcid.RemoveAt(npcindex);
                Spawns.npctype.RemoveAt(npcindex);
            }

        }

        public static void GroupeDeSpawn(Packet packet)
        {


            try
            {

                for (int i = 0; i < MainData.groupespawncount; i++)
                {
                    System.Threading.Thread.Sleep(1);
                    uint id = packet.ReadUInt();
                    int npcindex = Spawns.npcid.IndexOf(id);

                    for (int a = 0; a < Spawns.pets.Length; a++)
                    {
                        if (Spawns.pets[a].id == id)
                        {
                            Spawns.pets[a] = new Spawns.Pets_();
                            break;
                        }
                    }
                    for (int b = 0; b < Spawns.characters.Length; b++)
                    {
                        if (Spawns.characters[b].id == id)
                        {
                            Spawns.characters[b] = new Spawns.Characters_();
                            break;
                        }
                    }
                    for (int z = 0; z < Spawns.mob_id.Count; z++)
                    {
                        if (Spawns.mob_id[z] == id)
                        {
                            Spawns.mob_dist.RemoveAt(z);
                            Spawns.mob_id.RemoveAt(z);
                            Spawns.mob_name.RemoveAt(z);
                            Spawns.mob_priority.RemoveAt(z);
                            Spawns.mob_status.RemoveAt(z);
                            Spawns.mob_type.RemoveAt(z);
                            Spawns.mob_x.RemoveAt(z);
                            Spawns.mob_y.RemoveAt(z);
                            break;
                        }
                    }
                    for (int c = 0; c < Spawns.item_id.Count; c++)
                    {
                        if (Spawns.item_id[c] == id)
                        {
                            Spawns.item_id.RemoveAt(c);
                            Spawns.item_status.RemoveAt(c);
                            Spawns.item_type.RemoveAt(c);
                        }
                    }
                    if (npcindex != -1)
                    {
                        Spawns.npcid.RemoveAt(npcindex);
                        Spawns.npctype.RemoveAt(npcindex);
                    }


                }

            }
            catch (Exception)
            {

                Program.main.listBox1.Items.Add("GroupeSpawn Hata");
            }
        }

    }
}
