using bot.Clases.infoclass;
using bot.SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.Logica.Training
{
    class Berserk
    {

        public static void UseZerk()
        {
            Packet NewPacket = new Packet(Opcode.CLIENT_ZERK);
            NewPacket.WriteUInt8(0x01);
            Agent.Send(NewPacket);
        }

        public static void CheckBerserk(uint id, string mobtype)
        {
            if (Caracter.BerserkLevel == 5)
            {


                Berserk.UseZerk();


            }
        }

        public static string GetTypeName(byte type)
        {
            if (type == 0)
                return "Normal";
            else if (type == 1)
                return "Champion";
            else if (type == 2)
                return "Unique";
            else if (type == 4)
                return "Giant";
            else if (type == 5)
                return "Titan";
            else if ((type == 6) || (type == 7))
                return "Elite";
            else if (type == 16)
                return "Party";
            else if (type == 17)
                return "Party Champion";
            else if (type == 20)
                return "Party Giant";
            else return "";
        }
    }
}
