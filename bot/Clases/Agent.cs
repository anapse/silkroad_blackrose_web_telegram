namespace bot.Clases
{
    using SilkroadSecurityApi;
    using System;
    using System.Collections.Generic;
    using System.Net.Sockets;
    using System.Threading;
    using System.Diagnostics;
    using bot.Clases.infoclass;
    using global::SilkroadSecurityApi;

    public class Agent
    {
        private static readonly List<Packet> ag_packets = [];
        private static TransferBuffer ag_recv_buffer = new TransferBuffer(0x1000, 0, 0);
        private static Security ag_security = new Security();
        private static Socket ag_socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        private static uint locale;
        private static uint loginID;
        private static Thread? loop;
        private static string? password;
        private static string? username;
        private static uint version;



        public Agent()
        {
            if (App.MainViewModel != null)
            {
                version = uint.Parse(App.MainViewModel.Version);
                locale = App.MainViewModel.Localeid;
            }
        }



        public static void Agent_thread()
        {
            while (true)
            {
                SocketError success;
                Packet current;
                byte[] bytes;
                ag_recv_buffer.Size = ag_socket.Receive(ag_recv_buffer.Buffer, 0, ag_recv_buffer.Buffer.Length, SocketFlags.None, out success);
                if (success != SocketError.Success)
                {
                    if (success != SocketError.WouldBlock)
                    {
                        Debug.WriteLine("Caracter Disconnected.agente1");
                        return;
                    }
                }
                else if (ag_recv_buffer.Size > 0)
                {
                    ag_security.Recv(ag_recv_buffer);
                }
                else
                {
                    Debug.WriteLine("Caracter Disconnected.agente");
                    return;
                }
                List<Packet> collection = ag_security.TransferIncoming();
                if (collection != null)
                {
                    ag_packets.AddRange(collection);
                }
                if (ag_packets.Count > 0)
                {
                    using (List<Packet>.Enumerator enumerator = ag_packets.GetEnumerator())
                    {
                        while (enumerator.MoveNext())
                        {
                            current = enumerator.Current;
                            bytes = current.GetBytes();
                            if (current.Opcode == 0x3026)
                            {
                                string charname; string chat;
                                switch (current.ReadUInt8())
                                {
                                    case 1: // private chat
                                        uint UniqueID = current.ReadUInt32();
                                        chat = current.ReadAscii();

                                        OtherCharacter? foundCharacter = null;
                                        foreach (var character in OtherCharacter.Characters)
                                        {
                                            Console.WriteLine($"Revisando personaje - UniqueID: {character.UniqueID},  y {UniqueID} Nombre: {character.CharName}");
                                            if (character.UniqueID == UniqueID)
                                            {
                                                foundCharacter = character;
                                                break;
                                            }
                                        }
                                        if (foundCharacter != null)
                                        {
                                            charname = foundCharacter.CharName;
                                            Console.WriteLine($"Personaje encontrado: {charname}");
                                            if (Application.Current != null && Application.Current.Dispatcher != null)
                                            {
                                                Application.Current.Dispatcher.Dispatch(() =>
                                                {
                                                    App.ChatService?.AddMessage(charname, ":", chat, model.MessageType.All);
                                                });
                                            }
                                        }
                                        break;
                                    case 2: // private chat
                                        charname = current.ReadAscii();
                                        chat = current.ReadAscii();
                                        Application.Current?.Dispatcher?.Dispatch(() => {
                                            App.ChatService?.AddMessage(charname, "(From):", chat, model.MessageType.Pm);
                                        });
                                        break;
                                    case 6: // global chat
                                        charname = current.ReadAscii();
                                        chat = current.ReadAscii();
                                        Application.Current?.Dispatcher?.Dispatch(() => {
                                            App.ChatService?.AddMessage(charname, ":", chat, model.MessageType.Global);
                                        });
                                        break;
                                    case 7: // global chat
                                        charname = "Notice";
                                        chat = current.ReadAscii();
                                        Application.Current?.Dispatcher?.Dispatch(() => {
                                            App.ChatService?.AddMessage(charname, "(From):", chat, model.MessageType.Notice);
                                        });
                                        break;
                                }
                            }
                            //  this.Log("[S->C][{0:X4}][{1} bytes]{2}{3}{4}{5}{6}", new object[] { current.Opcode, bytes.Length, current.Encrypted ? "[Encrypted]" : "", current.Massive ? "[Massive]" : "", Environment.NewLine, Utility.HexDump(bytes), Environment.NewLine });
                            if ((current.Opcode != 0x5000) && (current.Opcode != 0x9000))
                            {
                                Packet packet4;
                                Packet packet5;
                                if (current.Opcode == 0x2001)
                                {
                                    if (current.ReadAscii() == "GatewayServer")
                                    {
                                        Global.Server = Global.ServerEnum.Gateway;
                                        packet4 = new Packet(0x6100, true, false);
                                        packet4.WriteUInt8(locale);
                                        packet4.WriteAscii("SR_Client");
                                        packet4.WriteUInt32(version);
                                        ag_security.Send(packet4);
                                    }
                                    else
                                    {
                                        Global.Server = Global.ServerEnum.Agent;
                                        packet5 = new Packet(0x6103);
                                        packet5.WriteUInt32(loginID);
#pragma warning disable CS8604
                                        packet5.WriteAscii(username);
                                        packet5.WriteAscii(password);
#pragma warning restore CS8604
                                        packet5.WriteUInt8((byte)0x16);
                                        packet5.WriteUInt32((uint)0);
                                        packet5.WriteUInt16((ushort)0);
                                        ag_security.Send(packet5);
                                    }
                                }

                                if (current.Opcode == 0x34B5)
                                {
                                    Agent.SendSpawn();
                                }

                                else
                                {
                                    OpcodeParser.Handler(current);
                                }

                            }
                        }
                    }
                    ag_packets.Clear();
                }
                List<KeyValuePair<TransferBuffer, Packet>> list2 = ag_security.TransferOutgoing();
                if (list2 != null)
                {
                    foreach (KeyValuePair<TransferBuffer, Packet> pair in list2)
                    {
                        TransferBuffer key = pair.Key;
                        current = pair.Value;
                        success = SocketError.Success;
                        while (key.Offset != key.Size)
                        {
                            int num6 = ag_socket.Send(key.Buffer, key.Offset, key.Size - key.Offset, SocketFlags.None, out success);
                            if ((success != SocketError.Success) && (success != SocketError.WouldBlock))
                            {
                                break;
                            }
                            key.Offset += num6;
                            Thread.Sleep(1);
                        }
                        if (success != SocketError.Success)
                        {
                            break;
                        }
                        bytes = current.GetBytes();
                        // this.Log("[C->S][{0:X4}][{1} bytes]{2}{3}{4}{5}{6}", new object[] { current.Opcode, bytes.Length, current.Encrypted ? "[Encrypted]" : "", current.Massive ? "[Massive]" : "", Environment.NewLine, Utility.HexDump(bytes), Environment.NewLine });
                    }
                    if (success != SocketError.Success)
                    {
                        return;
                    }
                }
                Thread.Sleep(1);
            }
        }



        public static void Private(string target, string message)
        {
            try
            {
                Packet pm = new Packet(0x7025);
                pm.WriteUInt8(0x02);
                pm.WriteUInt8(0x00);
                pm.WriteAscii(target);
                pm.WriteAscii(message);
                Send(pm);
            }
            catch { }
        }


        public static void Pinkserver()
        {
            Packet packet = new(0x2002);
            Send(packet);
        }
        public static void SendSpawn()
        {
            Packet packet4 = new Packet(0x34b6);
            Send(packet4);
        }

        public static void Send(Packet packet)
        {
            ag_security.Send(packet);
        }
        public static void Mensajes(string target, string message, string tipo)
        {
            if (string.Equals(tipo, "pm", StringComparison.OrdinalIgnoreCase))
            {
                Packet pm = new Packet(0x7025);
                pm.WriteUInt8(0x02);
                pm.WriteUInt8(0x00);
                pm.WriteAscii(target);
                pm.WriteAscii(message);
                Send(pm);
            }
            else if (string.Equals(tipo, "all", StringComparison.OrdinalIgnoreCase))
            {
                Packet send_all = new Packet(0x7025);
                send_all.WriteUInt8(0x03);
                send_all.WriteUInt8(0x00);
                send_all.WriteAscii(message);
                Send(send_all);
            }
        }
        public static void Start(string IP, string Port, uint _loginID, string _username, string _password)
        {
            loginID = _loginID;
            username = _username;
            password = _password;
            loop = new Thread(new ThreadStart(Agent.Agent_thread));
            ag_socket.Connect(IP, int.Parse(Port));
            loop.Start();
            ag_socket.Blocking = false;
            ag_socket.NoDelay = true;
            App.MainViewModel?.PlayerConectando();
        }
    }
}

