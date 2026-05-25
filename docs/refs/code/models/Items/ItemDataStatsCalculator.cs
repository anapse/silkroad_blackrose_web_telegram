using bot.model;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.infoclass.Items
{
    public class ItemDataStatsCalculator
    {
        private static Dictionary<string, ItemData> Itemdatatext = Data.Itemdatatext;
        public static string CalculadorSegunPorcentaje(string valorAcalcular, uint itemId, float percentage)
        {
            percentage = Math.Max(0, Math.Min(100, percentage)); // Limitar entre 0 y 100
            ItemData itemData = GetItemData(itemId);
            string porsentage = $" (+{percentage}%)";
            string result = "";
            switch (valorAcalcular.ToLower())
            {
                case "durabilidad":
                    float durL = ParseToFloat(itemData.Dur_L);
                    float durU = ParseToFloat(itemData.Dur_U);
                    result = (durL + ((durU - durL) * (percentage / 31))).ToString() + porsentage;
                    break;
                case "dañofisico":
                    float pdL = ParseToFloat(itemData.PD_L);
                    float pdU = ParseToFloat(itemData.PD_U);
                    result = (pdL + (pdU - pdL) * (percentage / 31)).ToString() + porsentage;
                    break;
                case "critical":
                    float CHRL = ParseToFloat(itemData.CHR_L);
                    float CHRU = ParseToFloat(itemData.CHR_U);
                    result = (CHRL + (CHRU - CHRL) * (percentage / 31)).ToString() + porsentage;
                    break;
                case "parry":
                    float erL = ParseToFloat(itemData.ER_L);
                    float erU = ParseToFloat(itemData.ER_U);
                    result = (erL + (erU - erL) * (percentage / 31)).ToString() + porsentage;
                    break;
                case "bloqueo":
                    float brL = ParseToFloat(itemData.BR_L);
                    float brU = ParseToFloat(itemData.BR_U);
                    result = (brL + (brU - brL) * (percentage / 100)).ToString() + porsentage;
                    break;
                case "hit":
                    float HRL = ParseToFloat(itemData.HR_L);
                    float HRU = ParseToFloat(itemData.HR_U);
                    result = (HRL + ((HRU - HRL) * (percentage / 100))).ToString() + porsentage;
                    break;
                case "magreinfo":
                    float mdintL = ParseToFloat(itemData.MDInt_L);
                    float mdintU = ParseToFloat(itemData.MDInt_U);
                    result = ((mdintL + ((mdintU - mdintL) * (percentage / 100))) / 10).ToString("0.0", CultureInfo.InvariantCulture) + " %" + porsentage;
                    break;
                case "phyreinfo":
                    float phystrL = ParseToFloat(itemData.PDStr_L);
                    float phystrU = ParseToFloat(itemData.PDStr_U);
                    result = ((phystrL + ((phystrU - phystrL) * (percentage / 100))) / 10).ToString("0.0", CultureInfo.InvariantCulture) + " %" + porsentage;
                    break;
                case "range":
                    float range = ParseToFloat(itemData.Range) / 10;
                    result = range.ToString("0.0", CultureInfo.InvariantCulture) + " m";
                    break;
                // Agrega más casos según sea necesario
                default:
                    throw new ArgumentException($"Tipo de valor desconocido: {valorAcalcular}.");
            }

            return $"{result}";

        }
        public static float ParseToFloat(string value)
        {
            return float.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var result) ? result : 0;
        }

        private static ItemData GetItemData(uint itemId)
        {
            if (Itemdatatext.TryGetValue(itemId.ToString(), out var itemData))
            {
                return itemData;
            }
            else
            {
                throw new KeyNotFoundException($"Item con ID {itemId} no encontrado.");
            }
        }
    }
}
