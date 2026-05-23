using bot.Clases.Controles;
using bot.Clases.infoclass;
using bot.Clases.Logica.Items;
using bot.Clases.Logica.Training;
using bot.SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using InventoryControl = bot.Clases.Controles.InventoryControl;

namespace bot.Clases
{

    class OpcodeParser
    {
        public static void Handler(Packet packet)
        {
            RevisarOpcode(packet);

            switch (packet.Opcode)
            {
                case (ushort)LoginServerOpcodes.SERVER_OPCODES.SERVER_LIST:
                    GatewayRespond(packet);

                    break;
                case (ushort)LoginServerOpcodes.SERVER_OPCODES.GAME_LOGIN_REPLY:
                    AgentRespond(packet);

                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_CHARACTERLISTING:
                    Caracter.CharacterList(packet);
                    break;


                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_CONFIRMSPAWN:
                    Caracter.CharID(packet);
                    Caracter.CharData(Caracter.CharPacket!);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_CHARDATA:
                    Caracter.CharPacket = packet;
                    App.MainViewModel?.PlayerConectado();
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_CHARACTERINFO:
                    Caracter.CaracterInfo(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_STUFFUPDATE:
                    Caracter.UpdateInfo(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_LVLUP:
                    Caracter.LevelUp(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_EXPSPUPDATE:
                    Caracter.ExpSpUpdate(packet);
                    break;

                #region Pets
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_PETINFO:
                    PetsData.PetInfo(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_PETSTATS:
                    PetsData.PetStats(packet);
                    break;
                #endregion

                #region Spawns
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_SINGLESPAWN:
                    Spawn.SingleSpawn(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_SINGLEDESPAWN:
                    Spawn.SingleDeSpawn(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_GROUPSPAWNB:
                    GroupSpawns.GroupeSpawnB(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_GROUPESPAWN:
                    GroupSpawns.Manager(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_GROUPSPAWNEND:
                    GroupSpawns.GroupSpawned();
                    break;
                #endregion

                #region Training
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_OBJECTDIE:
                    MonsterControl.MonsterAction(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_NPCSELECT:
                    MonsterControl.NPCSelect(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_NPCDESELECT:
                    MonsterControl.NPCDeselect(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_OBJECTSELECT:
                    Training.Selected(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_OBJECTACTION:
                    MonsterControl.Refresh(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_HPMPUPDATE:
                    HPMPPacket.HPMPUpdate(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_HORSEACTION:
                    PetsData.HorseAction(packet);
                    break;
                #endregion

                #region Storage
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_STORAGEITEMS:
                    StorageControl.ParseStorageItems(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_STORAGEGOLD:
                    StorageControl.StorageGold(packet);
                    break;
                #endregion

                #region Movement
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_MOVE:
                    Movement.Move(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_STUCK:
                    Movement.Stuck(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_SPEEDUPDATE:
                    Caracter.SpeedUpdate(packet);
                    break;
                #endregion

                #region Items
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_ITEMFIXED:
                    InventoryControl.ItemFixed(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_DURABILITYCHANGE:
                    InventoryControl.Durability(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_INVENTORYMOVEMENT:

                    InventoryControl.Inventory_Update1(packet);

                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_INVENTORYUSE:

                    InventoryControl.Inventory_Update(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_ITEMMODIFY:
                    InventoryControl.Inventory_Update2(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_ITEMRELEASE:

                    PickupControl.Itemfree(packet);
                    break;
                #endregion

                #region Skills
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_SKILLADD:
                    //  Skills.SkillAdd(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_SKILLUPDATE:
                    // Skills.SkillUpdate(packet);
                    break;
                #endregion

                #region Buffs
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_BUFFINFO:
                    //  Buffas.BuffAdd(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_BUFFDELL:
                    //  Buffas.BuffDell(packet);
                    break;
                #endregion

                #region Party
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_ACCEPTPARTY:
                    //   Party.AcceptParty(packet);
                    break;
                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_PARTYREMOVE:
                    //  Party.ReformParty(packet);
                    break;
                #endregion

                case (ushort)WorldServerOpcodes.SERVER_OPCODES.SERVER_LEAVE_SUCCESS:
                    Console.WriteLine("si descobnecto");

                    break;

            }
        }



        public static void AgentRespond(Packet packet)
        {
            byte check = packet.ReadUInt8();

            Packet packet55;
            if (check == 1)
            {
                packet55 = new Packet(0x7007);
                packet55.WriteUInt8((byte)2);
                Agent.Send(packet55);
            }




            else if (check == 2)
            {
                byte result = packet.ReadUInt8();
                switch (result)
                {
                    case 1:
                        App.MainViewModel?.UpdateServerResponse("Failed to connect to server. (C9)");
                        break;
                    case 2:
                        App.MainViewModel?.UpdateServerResponse("Failed to connect to server. (C10)");
                        break;
                    case 3:
                        App.MainViewModel?.UpdateServerResponse("Failed to connect to server. (C10)");
                        break;
                    case 4:
                        App.MainViewModel?.UpdateServerResponse("Server is full! Disconnected! Please restart the bot!");
                        break;
                    case 5:
                        App.MainViewModel?.UpdateServerResponse("Failed to connect to server because access to current IP has exceeded its limit.");
                        break;
                }
            }

        }

        public static void GatewayRespond(Packet packet)
        {

            string? name = null;
            byte OperationFlag = packet.ReadUInt8();

            while (OperationFlag == 1)
            {
                packet.ReadUInt8();
                packet.ReadAscii();
                OperationFlag = packet.ReadUInt8();
            }
            Data.ServerName.Clear();
            Data.ServerID.Clear();
            byte server = packet.ReadUInt8();

            while (server == 1)
            {
                ushort serverid = packet.ReadUInt16();
                name = packet.ReadAscii();
                ushort currentusers = packet.ReadUInt16();
                ushort capacity = packet.ReadUInt16();
                byte serverstatus = packet.ReadUInt8();
                packet.ReadUInt8();
                server = packet.ReadUInt8();
                Data.ServerName.Add(name);
                Data.ServerID.Add(serverid);
            }
            //  Globals.MainWindow.Updateserverlist();
            //  if (Globals.MainWindow.Checked(Globals.MainWindow.autologin) == true)
            /*   {
                   Console.WriteLine("envio de datos");
                   Packet NewPacket = new Packet((ushort)LoginServerOpcodes.CLIENT_OPCODES.LOGIN, true);
                   NewPacket.WriteUInt8(22);
                   NewPacket.WriteAscii(App.MainViewModel.Username);
                   NewPacket.WriteAscii(App.MainViewModel.Password);
                   NewPacket.WriteUInt16((ushort)0x40);
                   System.Threading.Thread.Sleep(300);
                   Gateway.SendToServer(NewPacket);
               }*/
        }

        public static void RevisarOpcode(Packet packet)
        {
            ushort opcodeUShort = (ushort)packet.Opcode;

            string opcodeName = GetOpcodeName(opcodeUShort);

            Debug.WriteLine($"Packet Opcode (ushort): 0x{opcodeUShort:X4} ({opcodeName})");
        }


        private static string GetOpcodeName(ushort opcode)
        {
            // Recorre todas las enumeraciones en LoginServerOpcodes
            foreach (var value in Enum.GetValues(typeof(LoginServerOpcodes.SERVER_OPCODES)))
            {
                if (Convert.ToUInt16(value) == opcode)
                    return $"LoginServer.SERVER_OPCODES.{value} (0x{opcode:X4})";
            }

            foreach (var value in Enum.GetValues(typeof(LoginServerOpcodes.CLIENT_OPCODES)))
            {
                if (Convert.ToUInt16(value) == opcode)
                    return $"LoginServer.CLIENT_OPCODES.{value} (0x{opcode:X4})";
            }

            // Recorre todas las enumeraciones en WorldServerOpcodes
            foreach (var value in Enum.GetValues(typeof(WorldServerOpcodes.SERVER_OPCODES)))
            {
                if (Convert.ToUInt16(value) == opcode)
                    return $"WorldServer.SERVER_OPCODES.{value} (0x{opcode:X4})";
            }

            foreach (var value in Enum.GetValues(typeof(WorldServerOpcodes.CLIENT_OPCODES)))
            {
                if (Convert.ToUInt16(value) == opcode)
                    return $"WorldServer.CLIENT_OPCODES.{value} (0x{opcode:X4})";
            }

            return $"Unknown Opcode (0x{opcode:X4})";
        }



    }


}
