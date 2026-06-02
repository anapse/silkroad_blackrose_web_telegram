        public static void SingleDeSpawn(Packet packet)
        {
            #region Deselect
            uint id = packet.data.ReadDWORD();
            if (id == BotData.selectedid)
            {
                BotData.selectedid = 0;
                BotData.selected = 0;
            }
            #endregion
            #region Items
            for (int z = 0; z < Spawns.item_id.Count; z++)
            {
                if (id == Spawns.item_id[z])
                {
                    Spawns.item_id.RemoveAt(z);
                    Spawns.item_status.RemoveAt(z);
                    Spawns.item_type.RemoveAt(z);
                    break;
                }
            }
            #endregion
            #region Chars
            for (int z = 0; z < Spawns.characters.Length; z++)
            {
                if (id == Spawns.characters[z].id)
                {
                    Spawns.characters[z] = new Spawns.Characters_();
                    break;
                }
            }
            #endregion
            #region Pets
            for (int z = 0; z < Spawns.pets.Length; z++)
            {
                if (id == Spawns.pets[z].id)
                {
                    Spawns.pets[z] = new Spawns.Pets_();
                    break;
                }
            }
            #endregion
            #region Mobs
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
                    Stuck.DeleteMob(id);
                    if (id == MonsterControl.monster_id)
                    {
                        MonsterControl.monster_id = 0;
                        MonsterControl.monster_selected = false;
                        MonsterControl.monster_type = 0;
                        Packet packetas = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_OBJECTACTION, false, enumDestination.Server);
                        packetas.data.AddBYTE(2);
                        Globals.ServerPC.SendPacket(packetas);
                        //Select New Monster, cause selected just disapeared.
                        System.Threading.Thread n_t = new System.Threading.Thread(LogicControl.Manager);
                        n_t.Start();
                    }
                    break;
                }
            }
            #endregion
            #region NPC
            int npc_index = Spawns.npcid.IndexOf(id);
            if (npc_index != -1)
            {
                Spawns.npcid.RemoveAt(npc_index);
                Spawns.npctype.RemoveAt(npc_index);
            }
            #endregion
        }