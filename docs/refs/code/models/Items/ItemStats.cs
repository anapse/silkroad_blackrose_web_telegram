using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases.infoclass.Items
{
    public class ItemStats
    {
        public int PhysicalDamage { get; set; }
        public int MagicalDamage { get; set; }
        public int Durability { get; set; }
        public int HitRatio { get; set; }
        public int Critical { get; set; }
        public int PhysicalReinforce { get; set; }
        public int MagicalReinforce { get; set; }
        public int PhysicalDefensive { get; set; }
        public int MagicalDefensive { get; set; }
        public int BlockRatio { get; set; }
        public int ParryRatio { get; set; }
        public int PhysicalAbsorption { get; set; }
        public int MagicalAbsorption { get; set; }
    }

    public enum ItemType
    {
        Weapon,
        Shield,
        Equipment,
        Accessory
    }

    public class ItemStatsCalculator
    {
        public ItemStats CalculateStats(ulong variance, ItemType itemType)
        {
            // Lista para almacenar los valores descompuestos
            var stats = new List<int>();

            // Descomponer el valor de variance en valores individuales
            if (variance == 0)
            {
                // Si variance es 0, inicializamos todos los valores a 0
                stats.AddRange(Enumerable.Repeat(0, GetExpectedCount(itemType)));
            }
            else
            {
                while (variance > 0)
                {
                    // Obtenemos el valor de los primeros 5 bits
                    var stat = (int)(variance & 0x1F);
                    variance >>= 5; // Desplazamos a la derecha para procesar el siguiente grupo de 5 bits
                    stats.Add(stat);
                }

                // Asegurarse de que la lista tenga el tamaño adecuado
                var expectedCount = GetExpectedCount(itemType);
                while (stats.Count < expectedCount)
                {
                    stats.Add(0); // Completar con ceros si hay menos valores
                }
            }

            // Inicializar el objeto de ItemStats
            var itemStats = new ItemStats();

            // Asignar los valores basados en el tipo de ítem
            switch (itemType)
            {
                case ItemType.Weapon:
                    if (stats.Count >= 7)
                    {
                        itemStats.PhysicalDamage = stats[4];
                        itemStats.MagicalDamage = stats[5];
                        itemStats.Durability = stats[0];
                        itemStats.HitRatio = stats[3];
                        itemStats.Critical = stats[6];
                        itemStats.PhysicalReinforce = stats[1];
                        itemStats.MagicalReinforce = stats[2];
                    }
                    else
                    {
                        throw new InvalidOperationException($"INVALID TYPE! WEAPON. Expected 7 values, but got {stats.Count}.");
                    }
                    break;

                case ItemType.Shield:
                    if (stats.Count >= 6)
                    {
                        itemStats.PhysicalDefensive = stats[4];
                        itemStats.MagicalDefensive = stats[5];
                        itemStats.Durability = stats[0];
                        itemStats.BlockRatio = stats[3];
                        itemStats.PhysicalReinforce = stats[1];
                        itemStats.MagicalReinforce = stats[2];
                    }
                    else
                    {
                        throw new InvalidOperationException($"INVALID TYPE! SHIELD. Expected 6 values, but got {stats.Count}.");
                    }
                    break;

                case ItemType.Equipment:
                    if (stats.Count >= 6)
                    {
                        itemStats.PhysicalDefensive = stats[3];
                        itemStats.MagicalDefensive = stats[4];
                        itemStats.Durability = stats[0];
                        itemStats.ParryRatio = stats[5];
                        itemStats.PhysicalReinforce = stats[1];
                        itemStats.MagicalReinforce = stats[2];
                    }
                    else
                    {
                        throw new InvalidOperationException($"INVALID TYPE! EQUIPMENT. Expected 6 values, but got {stats.Count}.");
                    }
                    break;

                case ItemType.Accessory:
                    if (stats.Count >= 2)
                    {
                        itemStats.PhysicalAbsorption = stats[0];
                        itemStats.MagicalAbsorption = stats[1];
                    }
                    else
                    {
                        throw new InvalidOperationException($"INVALID TYPE! ACCESSORY. Expected 2 values, but got {stats.Count}.");
                    }
                    break;

                default:
                    throw new ArgumentException($"Unknown item type: {itemType}.");
            }

            return itemStats;
        }

        private int GetExpectedCount(ItemType itemType)
        {
            // Devuelve la cantidad esperada de valores según el tipo de ítem
            return itemType switch
            {
                ItemType.Weapon => 7,
                ItemType.Shield => 6,
                ItemType.Equipment => 6,
                ItemType.Accessory => 2,
                _ => throw new ArgumentException($"Unknown item type: {itemType}.")
            };
        }
    }

}
