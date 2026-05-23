using bot.Clases.infoclass;
using bot.viewmodel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.Logica
{
    class Location
    {
        public static BotConfigViewModel? BotConfigViewModel => App.BotConfigViewModel;
        public static string? FindTown()
        {
            try
            {
                string? town = null;
                int ch_dist = Math.Abs((6432 - Caracter.X)) + Math.Abs((1096 - Caracter.Y));
                int wc_dist = Math.Abs((3553 - Caracter.X)) + Math.Abs((2072 - Caracter.Y));
                int kt_dist = Math.Abs((112 - Caracter.X)) + Math.Abs((16 - Caracter.Y));
                int ca_dist = Math.Abs((-5156 - Caracter.X)) + Math.Abs((2831 - Caracter.Y));
                int eu_dist = Math.Abs((-10659 - Caracter.X)) + Math.Abs((2603 - Caracter.Y));
                int train_dist = Math.Abs(Convert.ToInt32(Caracter.X) - Caracter.X) + Math.Abs(Convert.ToInt32(Caracter.Y) - Caracter.Y);

                if (train_dist <= Convert.ToInt32(BotConfigViewModel?.SliderValue))
                {
                    town = "train";
                }
                if (ch_dist <= 100)
                {
                    town = "ch";
                }
                if (wc_dist <= 100)
                {
                    town = "wc";
                }
                if (kt_dist <= 100)
                {
                    town = "kt";
                }
                if (ca_dist <= 100)
                {
                    town = "ca";
                }
                if (eu_dist <= 100)
                {
                    town = "eu";
                }
                Console.WriteLine("esta es la " + town);
                return town;
            }
            catch (Exception)
            {
                //Globals.MainWindow.UpdateLogs("Set training coordinates first!");
                return null;
            }
        }
    }
}
