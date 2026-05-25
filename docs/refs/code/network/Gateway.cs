namespace bot.Clases
{
    using global::SilkroadSecurityApi;
    using SilkroadSecurityApi;
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Net.Sockets;
    using System.Threading;

    public class Gateway
    {
        private static List<Packet> gw_packets = new List<Packet>();
        private static TransferBuffer gw_recv_buffer = new TransferBuffer(0x1000, 0, 0);
        private static Security gw_security = new Security();
        private static Socket? gw_socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        private static uint locale;
        private static Thread? loop;
        private static uint version;
        private static CancellationTokenSource cts = new CancellationTokenSource();



        public Gateway()
        {
            if (App.MainViewModel != null)
            {

                version = uint.Parse(App.MainViewModel.Version);

                locale = App.MainViewModel.Localeid;
            }

        }
        public static void Gateway_thread()
        {
            if (gw_recv_buffer == null || gw_socket == null)
            {
                // Manejo del error si gw_recv_buffer o gw_socket son null
                Console.WriteLine("gw_recv_buffer o gw_socket no están inicializados.");
                return;
            }
            //  Debug.WriteLine("start gateway2");
            while (true)
            {
                SocketError success;
                byte[] bytes;
                gw_recv_buffer.Size = gw_socket.Receive(gw_recv_buffer.Buffer, 0, gw_recv_buffer.Buffer.Length, SocketFlags.None, out success);
                if (success != SocketError.Success)
                {

                    if (success != SocketError.WouldBlock)
                    {

                        return;
                    }
                }
                else if (gw_recv_buffer.Size > 0)
                {
                    //  Debug.WriteLine("start gateway5");
                    gw_security.Recv(gw_recv_buffer);
                }
                else
                {
                    //  Debug.WriteLine("start gateway6");
                    return;
                }
                List<Packet> collection = gw_security.TransferIncoming();
                if (collection != null)
                {
                    //  Debug.WriteLine("start gateway7");
                    gw_packets.AddRange(collection);
                }
                if (gw_packets.Count > 0)
                {
                    //  Debug.WriteLine("start gateway8");
                    foreach (Packet packet in gw_packets)
                    {
                        // Debug.WriteLine("start gateway9");
                        Packet packet2;
                        bytes = packet.GetBytes();

                        // this.Log("[S->C][{0:X4}][{1} bytes]{2}{3}{4}{5}{6}", new object[] { packet.Opcode, bytes.Length, packet.Encrypted ? "[Encrypted]" : "", packet.Massive ? "[Massive]" : "", Environment.NewLine, Utility.HexDump(bytes), Environment.NewLine });
                        if ((packet.Opcode == 0x5000) || (packet.Opcode == 0x9000))
                        {
                            continue;
                        }
                        if (packet.Opcode == 0x2001)
                        {
                            if (packet.ReadAscii() == "GatewayServer")
                            {

                                App.MainViewModel?.Conectando();
                                _ = App.MainViewModel?.StartLoop();
                                Global.Server = Global.ServerEnum.Gateway;
                                packet2 = new Packet(0x6100, true, false);
                                packet2.WriteUInt8(locale);
                                packet2.WriteAscii("SR_Client");
                                packet2.WriteUInt32(version);
                                gw_security.Send(packet2);

                            }
                        }
                        else if (packet.Opcode == 0xa100)
                        {

                            switch (packet.ReadUInt8())
                            {
                                case 1:
                                    packet2 = new Packet(0x6101, true);
                                    gw_security.Send(packet2);
                                    break; // Salir del switch y continuar con el flujo normal

                                case 2:
                                    Debug.WriteLine("The version is incorrect, please restart the program!");
                                    break; // Salir del switch y continuar con el flujo normal

                                default:
                                    return; // Si el subOpcode no coincide con 1 o 2, salimos de la función
                            }

                        }
                        else if (packet.Opcode == 0xa101)
                        {


                            App.MainViewModel?.UpdateServerResponse("Enviando Tu ID & PW now!");
                            App.MainViewModel?.Conectado();
                            OpcodeParser.Handler(packet);

                            SendDatos(idplayer: App.MainViewModel?.Username ?? string.Empty, contrasena: App.MainViewModel?.Password ?? string.Empty);
                        }
                        else if (packet.Opcode == 0xa102)
                        {
                            byte num2 = packet.ReadUInt8();
                            if (num2 == 1)
                            {
                                uint num3 = packet.ReadUInt32();
                                string iP = packet.ReadAscii();
                                ushort num4 = packet.ReadUInt16();
                                Agent.Start(iP, num4.ToString(), num3, App.MainViewModel?.Username ?? string.Empty, App.MainViewModel?.Password ?? string.Empty);
                                break;
                            }
                            if (num2 == 2)
                            {
                                switch (packet.ReadUInt8())
                                {
                                    case 1:
                                        {
                                            byte num6 = packet.ReadUInt8();
                                            byte num7 = packet.ReadUInt8();
                                            byte num8 = packet.ReadUInt8();
                                            byte num9 = packet.ReadUInt8();
                                            byte num10 = packet.ReadUInt8();
                                            Debug.WriteLine("Wrong password  ( " + num10 + " / " + num6 + " )");
                                            break;
                                        }
                                    case 2:
                                        if (packet.ReadUInt8() == 1)
                                        {
                                            Debug.WriteLine("Blocked cause: " + packet.ReadAscii());
                                        }
                                        break;

                                    case 3:
                                        Debug.WriteLine("Already logged in !");
                                        break;
                                }
                            }
                        }
                        else if (packet.Opcode == 0x2322)
                        {
                            Debug.WriteLine("capcha");
                            Gateway.SendCaptcha();
                        }



                    }
                    gw_packets.Clear();
                }
                List<KeyValuePair<TransferBuffer, Packet>> list2 = gw_security.TransferOutgoing();
                if (list2 != null)
                {
                    foreach (KeyValuePair<TransferBuffer, Packet> pair in list2)
                    {
                        TransferBuffer key = pair.Key;
                        Packet packet = pair.Value;
                        success = SocketError.Success;
                        while (key.Offset != key.Size)
                        {
                            int num19 = gw_socket.Send(key.Buffer, key.Offset, key.Size - key.Offset, SocketFlags.None, out success);
                            if ((success != SocketError.Success) && (success != SocketError.WouldBlock))
                            {
                                break;
                            }
                            key.Offset += num19;
                            Thread.Sleep(1);
                        }
                        if (success != SocketError.Success)
                        {
                            break;
                        }
                        bytes = packet.GetBytes();
                        //this.Log("[C->S][{0:X4}][{1} bytes]{2}{3}{4}{5}{6}", new object[] { packet.Opcode, bytes.Length, packet.Encrypted ? "[Encrypted]" : "", packet.Massive ? "[Massive]" : "", Environment.NewLine, Utility.HexDump(bytes), Environment.NewLine });
                    }
                    if (success != SocketError.Success)
                    {

                        return;
                    }
                }
                Thread.Sleep(1);
            }
        }



        public static void SendToServer(Packet packet)
        {
            gw_security.Send(packet);
        }
        public static void Pinkserver()
        {
            Packet packet = new(0x2002);
            SendToServer(packet);
        }


        public static void SendCaptcha()
        {
            Packet packet = new Packet(0x6323);
            packet.WriteAscii(App.MainViewModel?.Captcha ?? string.Empty);
            SendToServer(packet);
        }
        public static void SendDatos(string idplayer, string contrasena)
        {

            Packet packet4 = new(0x6102, true);
            packet4.WriteUInt8((byte)0x16);
            packet4.WriteAscii(idplayer);
            packet4.WriteAscii(contrasena);
            packet4.WriteUInt16((ushort)0x40);
            gw_security.Send(packet4);
        }

   
        public static void Stop()
        {
            try
            {
                if (cts != null)
                {
                    cts.Cancel(); // Cancelar el token
                }

                if (gw_socket != null)
                {
                    if (gw_socket.Connected)
                    {
                        gw_socket.Shutdown(SocketShutdown.Both);
                    }
                    gw_socket.Close();
                    gw_socket = null;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error al detener el Gateway: " + ex.Message);
            }
        }

        public static bool IsRunning()
        {
            return loop != null && loop.IsAlive;
        }
        public static void Start()
        {

            try
            {
                if (IsRunning())
                {
                    Stop(); // Detener cualquier conexión existente
                }

                Gateway gateway = new Gateway();

/* Cambio no fusionado mediante combinación del proyecto 'bot (net8.0-windows10.0.19041.0)'
Antes:
                loop = new Thread(gateway.Gateway_thread);
Después:
                loop = new Thread(Gateway_thread);
*/
                loop = new Thread(Gateway.Gateway_thread);

                // Inicializar el socket antes de conectarlo
                gw_socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                gw_socket.Connect(App.MainViewModel?.Ipserver ?? string.Empty, int.Parse(App.MainViewModel?.Puerto ?? string.Empty));

                // Configurar el socket
                gw_socket.Blocking = false;
                gw_socket.NoDelay = true;

                // Iniciar el hilo
                loop.Start();
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error al iniciar el Gateway: " + ex.Message);
                Stop(); // Asegurarse de detener todo si hay un error
            }
        }

    }
}

