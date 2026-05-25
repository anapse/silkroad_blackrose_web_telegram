using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.model
{
    public class DataItemInventory
    {
     
        public uint ItemRefItemID { get; set; } 
        public string? Name { get; set; } 
        public byte ItemSlot { get; set; }
        public string? CodeName { get; set; }
        public string? Icon { get; set; }
        public int Level { get; set; }
        public uint MaxDurability { get; set; }
        public byte OptLevel { get; set; }
        public ulong Variance { get; set; }
        public uint Durability {  get; set; }
        public byte MagParamNum  { get; set; }
        public int Count { get; set; }
    }
}
