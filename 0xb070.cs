using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Timers;
namespace Silkroad
{
    class Skills
    {
        public static Timer[] skills_timer = new Timer[Skills_Info.skillsidlist.Count];

        public static void SkillAdd(Packet packet)
        {
            if (packet.data.ReadBYTE() == 0x01)
            {
                if (packet.data.ReadBYTE() == 0x02)
                {
                    if (packet.data.ReadBYTE() == 0x30)
                    {
                        uint skill_id = packet.data.ReadDWORD();
                        uint attacker_id = packet.data.ReadDWORD();
                        if (attacker_id == Character.ID)
                        {
                            //Skill casted !
                            packet.data.ReadDWORD();
                            packet.data.ReadDWORD();
                            Checker(skill_id);



                            if (MonsterControl.general_id != MonsterControl.monster_id)
                            {
                                Packet packetas = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTSELECT, false, enumDestination.Server);
                                packetas.data.AddDWORD(MonsterControl.monster_id);
                                Globals.ServerPC.SendPacket(packetas);
                            }
                            if (BotData.bot)
                            {
                                if (MonsterControl.monster_selected)
                                {
                                    Movement.stuck_count = 0;
                                }
                            }
                        }
                        else
                        {
                            packet.data.ReadDWORD();
                            uint obj_id = packet.data.ReadDWORD();
                            if (obj_id == Character.ID || (obj_id == Char_Data.char_attackpetid && Globals.MainWindow.attackpet_protect.Checked))
                            {
                                if (BotData.bot && !BotData.loop)
                                {
                                    for (int i = 0; i < Spawns.mob_id.Count; i++)
                                    {
                                        if (Spawns.mob_id[i] == attacker_id)
                                        {
                                            Spawns.mob_status[i] = 0;
                                            Spawns.mob_priority[i] = 1;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                byte type = packet.data.ReadBYTE();
                switch (type)
                {
                    case 0x10:
                        if (MonsterControl.monster_selected && MonsterControl.monster_id != 0)
                        {
                            Stuck.AddMob(MonsterControl.monster_id, 10);
                            MonsterControl.monster_id = 0;
                            MonsterControl.monster_type = 0;
                            MonsterControl.monster_selected = false;
                        }
                        break;
                }
            }
        }
        public static void ImbueCast()
        {
            if (Globals.MainWindow.imbue_name.Text != "")
            {
                uint imbue_id = Char_Data.skillid[Char_Data.skillname.IndexOf(Globals.MainWindow.imbue_name.Text)];
                int skill_index = Skills_Info.skillsidlist.IndexOf(imbue_id);
                if (MonsterControl.monster_selected && Skills_Info.skillsstatuslist[skill_index] == 0 && Skills_Info.skillsmpreq[skill_index] <= Character.CurrentMP)
                {
                    Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION, false, enumDestination.Server);
                    packet.data.AddBYTE(0x01);
                    packet.data.AddBYTE(0x04);
                    packet.data.AddDWORD(imbue_id);
                    packet.data.AddBYTE(0x00);
                    Globals.ServerPC.SendPacket(packet);
                }
            }
        }
        public static void Checker(uint id)
        {
            int index = Skills_Info.skillsidlist.IndexOf(id);
            Skills_Info.skillsstatuslist.RemoveAt(index);
            Skills_Info.skillsstatuslist.Insert(index, 1);
            skills_timer[index] = new Timer();
            skills_timer[index] = new Timer();
            int interval = Skills_Info.skillcooldownlist[index] - 100;
            if (interval <= 0)
            {
                interval = 1;
            }
            skills_timer[index].Interval = interval;
            skills_timer[index].Elapsed += new ElapsedEventHandler(Skills_Elapsed);
            skills_timer[index].Start();
            skills_timer[index].Enabled = true;
        }
        static void Skills_Elapsed(object sender, ElapsedEventArgs e)
        {
            int index = 0;
            try
            {
                for (int i = 0; i < skills_timer.Length; i++)
                {
                    if ((Timer)sender == skills_timer[i])
                    {
                        index = i;
                        break;
                    }
                }
                skills_timer[index].Stop();
                skills_timer[index].Dispose();
            }
            catch { }
            try
            {
                Skills_Info.skillsstatuslist.RemoveAt(index);
                Skills_Info.skillsstatuslist.Insert(index, 0);
            }
            catch { }
        }
        public static void CheckSkills()
        {
            try
            {
                if (BotData.bot && MonsterControl.monster_selected)
                {
                    for (int i = 0; i < Globals.MainWindow.skills_general_list.Items.Count; i++)
                    {
                        if (Char_Data.f_wep_name != "" && Char_Data.f_wep_name != null)
                        {
                            int index = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                            if (index == -1)
                            {
                                Char_Data.f_wep_name = "";
                            }
                        }
                        System.Threading.Thread.Sleep(10);
                        if (Char_Data.f_wep_name != "")
                        {
                            int char_skillindex = Char_Data.skillname.IndexOf(Globals.MainWindow.skills_general_list.Items[i].ToString());
                            uint id = Char_Data.skillid[char_skillindex];
                            int main_skillindex = Skills_Info.skillsidlist.IndexOf(id);
                            int main_skillstatus = Skills_Info.skillsstatuslist[main_skillindex];
                            int main_skillmpreq = Skills_Info.skillsmpreq[main_skillindex];
                            if (main_skillstatus == 0 && main_skillmpreq <= Character.CurrentMP)
                            {
                                System.Threading.Thread.Sleep(1);
                                int index1 = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                                if (Char_Data.inventoryslot[index1] != 6)
                                {
                                    System.Threading.Thread.Sleep(1);
                                    Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYMOVEMENT, false, enumDestination.Server);
                                    packet.data.AddBYTE(0x00);
                                    packet.data.AddBYTE((byte)Char_Data.inventoryslot[index1]);
                                    packet.data.AddBYTE(0x06);
                                    packet.data.AddBYTE(0x00);
                                    packet.data.AddWORD(0x0000);
                                    Globals.ServerPC.SendPacket(packet);
                                    break;
                                }
                                else
                                {
                                    System.Threading.Thread.Sleep(1);
                                    ImbueCast();
                                    CastSkill(id, MonsterControl.monster_id);
                                    break;
                                }
                            }
                            if (i + 1 == Globals.MainWindow.skills_general_list.Items.Count)
                            {
                                System.Threading.Thread.Sleep(1);
                                int index1 = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                                if (Char_Data.inventoryslot[index1] != 6)
                                {
                                    System.Threading.Thread.Sleep(1);
                                    Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYMOVEMENT, false, enumDestination.Server);
                                    packet.data.AddBYTE(0x00);
                                    packet.data.AddBYTE((byte)Char_Data.inventoryslot[index1]);
                                    packet.data.AddBYTE(0x06);
                                    packet.data.AddBYTE(0x00);
                                    packet.data.AddWORD(0x0000);
                                    Globals.ServerPC.SendPacket(packet);
                                }
                                else
                                {
                                    System.Threading.Thread.Sleep(1);
                                    ImbueCast();
                                    Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION, false, enumDestination.Server);
                                    packet.data.AddBYTE(0x01);
                                    packet.data.AddBYTE(0x01);
                                    packet.data.AddBYTE(0x01);
                                    packet.data.AddDWORD(MonsterControl.monster_id);
                                    Globals.ServerPC.SendPacket(packet);
                                }
                            }
                        }
                        else
                        {
                            BotData.bot = false;
                            BotData.loop = false;
                            Globals.MainWindow.start_button.Text = "Start Bot";
                            Globals.UpdateLogs("Bot Stops ! Cannot Find 1st Weapon");
                            break;
                        }
                    }
                    if (Globals.MainWindow.skills_general_list.Items.Count == 0)
                    {
                        if (Char_Data.f_wep_name != "" && Char_Data.f_wep_name != null)
                        {
                            int index = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                            if (index == -1)
                            {
                                Char_Data.f_wep_name = "";
                            }
                        }
                        System.Threading.Thread.Sleep(1);
                        if (Char_Data.f_wep_name != "")
                        {
                            int index1 = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                            if (Char_Data.inventoryslot[index1] != 6)
                            {
                                System.Threading.Thread.Sleep(1);
                                Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYMOVEMENT, false, enumDestination.Server);
                                packet.data.AddBYTE(0x00);
                                packet.data.AddBYTE((byte)Char_Data.inventoryslot[index1]);
                                packet.data.AddBYTE(0x06);
                                packet.data.AddBYTE(0x00);
                                packet.data.AddWORD(0x0000);
                                Globals.ServerPC.SendPacket(packet);
                            }
                            else
                            {
                                System.Threading.Thread.Sleep(1);
                                ImbueCast();
                                int mob_index = Spawns.mob_id.IndexOf(MonsterControl.monster_id);
                                if (mob_index != -1)
                                {
                                    Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION, false, enumDestination.Server);
                                    packet.data.AddBYTE(0x01);
                                    packet.data.AddBYTE(0x01);
                                    packet.data.AddBYTE(0x01);
                                    packet.data.AddDWORD(MonsterControl.monster_id);
                                    Globals.ServerPC.SendPacket(packet);
                                }
                                else
                                {
                                    MonsterControl.monster_id = 0;
                                    MonsterControl.monster_type = 0;
                                    MonsterControl.monster_selected = false;
                                    LogicControl.Manager();
                                }
                            }
                        }
                        else
                        {
                            BotData.bot = false;
                            BotData.loop = false;
                            Globals.MainWindow.start_button.Text = "Start Bot";
                            Globals.UpdateLogs("Bot Stops ! Cannot Find 1st Weapon");
                        }
                    }
                }
            }
            catch
            {
                Globals.UpdateLogs("Skills Problem");
            }
        }

        #region CheckSkillsParty
        public static void CheckSkillsParty()
        {
            try
            {
                if (BotData.bot)
                {
                        for (int i = 0; i < Globals.MainWindow.skills_party_list.Items.Count; i++)
                        {
                            if (Char_Data.f_wep_name != "" && Char_Data.f_wep_name != null)
                            {
                                int index = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                                if (index == -1)
                                {
                                    Char_Data.f_wep_name = "";
                                }
                            }
                            System.Threading.Thread.Sleep(10);
                            if (Char_Data.f_wep_name != "")
                            {

                                int char_skillindex = Char_Data.skillname.IndexOf(Globals.MainWindow.skills_party_list.Items[i].ToString());
                                uint id = Char_Data.skillid[char_skillindex];
                                int main_skillindex = Skills_Info.skillsidlist.IndexOf(id);
                                int main_skillstatus = Skills_Info.skillsstatuslist[main_skillindex];
                                int main_skillmpreq = Skills_Info.skillsmpreq[main_skillindex];
                                if (main_skillstatus == 0 && main_skillmpreq <= Character.CurrentMP)
                                {
                                    System.Threading.Thread.Sleep(1);
                                    int index1 = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                                    if (Char_Data.inventoryslot[index1] != 6)
                                    {
                                        System.Threading.Thread.Sleep(1);
                                        Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYMOVEMENT, false, enumDestination.Server);
                                        packet.data.AddBYTE(0x00);
                                        packet.data.AddBYTE((byte)Char_Data.inventoryslot[index1]);
                                        packet.data.AddBYTE(0x06);
                                        packet.data.AddBYTE(0x00);
                                        packet.data.AddWORD(0x0000);
                                        Globals.ServerPC.SendPacket(packet);
                                        break;
                                    }
                                    else
                                    {
                                        System.Threading.Thread.Sleep(1);
                                        ImbueCast();
                                        CastSkill(id, MonsterControl.monster_id);
                                        break;
                                    }
                                }
                                if (i + 1 == Globals.MainWindow.skills_party_list.Items.Count)
                                {
                                    System.Threading.Thread.Sleep(1);
                                    int index1 = Char_Data.inventorytype.IndexOf(Char_Data.f_wep_name);
                                    if (Char_Data.inventoryslot[index1] != 6)
                                    {
                                        System.Threading.Thread.Sleep(1);
                                        Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_INVENTORYMOVEMENT, false, enumDestination.Server);
                                        packet.data.AddBYTE(0x00);
                                        packet.data.AddBYTE((byte)Char_Data.inventoryslot[index1]);
                                        packet.data.AddBYTE(0x06);
                                        packet.data.AddBYTE(0x00);
                                        packet.data.AddWORD(0x0000);
                                        Globals.ServerPC.SendPacket(packet);
                                    }
                                    else
                                    {
                                        System.Threading.Thread.Sleep(1);
                                        ImbueCast();
                                        int mob_index = Spawns.mob_id.IndexOf(MonsterControl.monster_id);
                                        if (mob_index != -1)
                                        {
                                            Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION, false, enumDestination.Server);
                                            packet.data.AddBYTE(0x01);
                                            packet.data.AddBYTE(0x01);
                                            packet.data.AddBYTE(0x01);
                                            packet.data.AddDWORD(MonsterControl.monster_id);
                                            Globals.ServerPC.SendPacket(packet);
                                        }
                                        else
                                        {
                                            MonsterControl.monster_id = 0;
                                            MonsterControl.monster_type = 0;
                                            MonsterControl.monster_selected = false;
                                            LogicControl.Manager();
                                        }
                                    }
                                }
                            }
                            else
                            {
                                BotData.bot = false;
                                BotData.loop = false;
                                Globals.MainWindow.start_button.Text = "Start Bot";
                                Globals.UpdateLogs("Bot Stops ! Cannot Find 1st Weapon");
                                break;
                            }
                        }
                        if (Globals.MainWindow.skills_party_list.Items.Count == 0)
                        {
                            System.Threading.Thread.Sleep(1);
                            CheckSkills();
                        }
                }
            }
            catch
            {
                Globals.UpdateLogs("Skills Problem");
            }
        }
        #endregion
        #region CastSkill
        public static void CastSkill(uint skill_id, uint mob_id)
        {
            int index = Spawns.mob_id.IndexOf(mob_id);
            if (index != -1)
            {
                if (Spawns.mob_status[index] == 0)
                {
                    Packet packet = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION, false, enumDestination.Server);
                    packet.data.AddBYTE(0x01);
                    packet.data.AddBYTE(0x04);
                    packet.data.AddDWORD(skill_id);
                    packet.data.AddBYTE(0x01);
                    packet.data.AddDWORD(mob_id);
                    Globals.ServerPC.SendPacket(packet);
                }
            }
        }
        #endregion

        #region SkillUpdate
        public static void SkillUpdate(Packet packet)
        {
            if (packet.data.ReadBYTE() == 0x01)
            {
                uint new_skill_id = packet.data.ReadDWORD();
                string new_skill_name = Skills_Info.skillsnamelist[Skills_Info.skillsidlist.IndexOf(new_skill_id)];
                int char_data_index = Char_Data.skillname.IndexOf(new_skill_name);
                int skill_list_index = Globals.MainWindow.skills_list.Items.IndexOf(new_skill_name);
                if (skill_list_index == -1)
                {
                    Char_Data.skillid.Add(new_skill_id);
                    Char_Data.skillname.Add(Skills_Info.skillsnamelist[Skills_Info.skillsidlist.IndexOf(new_skill_id)]);
                    Char_Data.skilltype.Add(Skills_Info.skillstypelist[Skills_Info.skillsidlist.IndexOf(new_skill_id)]);
                    Globals.MainWindow.skills_list.Items.Add(Skills_Info.skillsnamelist[Skills_Info.skillsidlist.IndexOf(new_skill_id)]);
                }
                else
                {
                    Char_Data.skillid.RemoveAt(char_data_index);
                    Char_Data.skilltype.RemoveAt(char_data_index);
                    Char_Data.skillid.Insert(char_data_index, new_skill_id);
                    Char_Data.skilltype.Insert(char_data_index, Skills_Info.skillstypelist[Skills_Info.skillsidlist.IndexOf(new_skill_id)]);
                }
            }
        }
        #endregion
    }
}
