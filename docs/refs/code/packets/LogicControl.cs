using bot.Clases.infoclass;
using bot.Clases.Logica.Training;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static bot.Clases.infoclass.OtherCharacter;

namespace bot.Clases.Controles
{
    class LogicControl
    {
        public static void Manager()
        {

            if (Data.bot && Data.dead == false)
            {

                if (Data.char_grabpetid != 0 && PickupControl.there_is_pickable == true)
                {
                    PickupControl.NormalFilter();

                }

            }

        }


    }
}