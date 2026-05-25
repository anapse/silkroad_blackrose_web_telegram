using bot.Clases.infoclass;
using bot.SilkroadSecurityApi;

namespace bot.Clases.Controles
{
    class StartLooping
    {
        public static string? type = null;
        public static void Start()
        {

            if (Data.bot)
            {
                type = Logica.Location.FindTown();
                switch (type)
                {
                    case null:
                        Data.loopend = 0;
                        Data.loop = false;
                        Data.bot = false;
                        Console.WriteLine("aki 9");
                        break;
                    case "train":
                        if (Data.char_horseid == 0)
                        {
                            Data.loopend = 0;
                            Data.loop = false;
                            Data.bot = true;
                            PickupControl.there_is_pickable = true;
                            // Buffas.buff_waiting = true;


                            Console.WriteLine("este es el starlopin ");

                            LogicControl.Manager();
                        }
                        else
                        {
                            Data.loopaction = "dismounthorse";
                            Packet NewPacket = new Packet((ushort)WorldServerOpcodes.CLIENT_OPCODES.CLIENT_KILLHORSE);
                            NewPacket.WriteUInt32(Data.char_horseid);
                            Agent.Send(NewPacket);
                        }
                        break;
                    case "ch":


                        if (Data.char_horseid == 0)
                        {
                            Data.loopaction = "mounthorse";
                             BotAction.MountHorse();
                        }
                        else
                        {
                            Data.loopend = 1;
                            // StartLooping.LoadTrainScript();
                        }
                        break;

                    case "wc":


                        if (Data.char_horseid == 0)
                        {
                            Data.loopaction = "mounthorse";
                            // BotAction.MountHorse();
                        }
                        else
                        {
                            Data.loopend = 1;
                            // StartLooping.LoadTrainScript();
                        }

                        break;
                    case "kt":


                        if (Data.char_horseid == 0)
                        {
                            Data.loopaction = "mounthorse";
                            //BotAction.MountHorse();
                        }
                        else
                        {
                            Data.loopend = 1;
                            // StartLooping.LoadTrainScript();
                        }


                        break;
                    case "ca":


                        if (Data.char_horseid == 0)
                        {
                            Data.loopaction = "mounthorse";
                            // BotAction.MountHorse();
                        }
                        else
                        {
                            Data.loopend = 1;
                            // StartLooping.LoadTrainScript();
                        }

                        break;
                    case "eu":

                        if (Data.char_horseid == 0)
                        {
                            Data.loopaction = "mounthorse";
                            // BotAction.MountHorse();
                        }
                        else
                        {
                            Data.loopend = 1;
                            // StartLooping.LoadTrainScript();
                        }


                        break;
                }
            }
        }



        public static void CheckStart()
        {

            Data.bot = true;
            StartLooping.Start();

        }
    }

}





