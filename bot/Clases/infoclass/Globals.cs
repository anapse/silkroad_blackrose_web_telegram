using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.infoclass
{
    class Globals
    {

        #region Form Invoke


        #endregion

        public static UInt32 String_To_UInt32(string s)
        {
            s = s.Trim();
            if (UInt32.TryParse(s, out UInt32 result))
            {
                return result;
            }

            Debug.WriteLine($"No se pudo convertir '{s}' a UInt32");
            return 0; // O cualquier otro valor que indique un error en tu sistema
        }



        public static int CalculatePositionX(ushort xSector, float X)
        {
            return (int)((xSector - 135) * 192 + X / 10);
        }
        public static int CalculatePositionY(ushort ySector, float Y)
        {
            return (int)((ySector - 92) * 192 + Y / 10);
        }

        public static string StringToHex(String name)
        {
            char[] charValues = name.ToCharArray();
            string hexOutput = "";
            foreach (char _eachChar in charValues)
            {
                // Get the integral value of the character.
                int value = Convert.ToInt32(_eachChar);
                // Convert the decimal value to a hexadecimal value in string form.
                hexOutput += String.Format("{0:X}", value);
            }
            return hexOutput;
        }

        public static byte[] StringToByteArray(String hex)
        {
            return Enumerable.Range(0, hex.Length)
                             .Where(x => x % 2 == 0)
                             .Select(x => Convert.ToByte(hex.Substring(x, 2), 16))
                             .ToArray();
        }
    }
}
