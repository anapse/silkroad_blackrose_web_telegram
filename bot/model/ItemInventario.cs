using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.model
{
    public class ItemInventario : INotifyPropertyChanged
    {
        private ImageSource? icon;

        private byte slot;
        public string? Name { get; set; }
        private uint id;
        private int quantity;
        private ImageSource? inventarioSlot;

        public uint Id
        {
            get => id;
            set
            {
                id = value;
                OnPropertyChanged(nameof(Id));
            }
        }
        public ImageSource? Icon
        {
            get => icon; set
            {
                icon = value;
                OnPropertyChanged(nameof(Icon));
            }
        }
        public ImageSource? InventarioSlot
        {
            get => inventarioSlot; set
            {
                inventarioSlot = value;
                OnPropertyChanged(nameof(InventarioSlot));
            }
        }


        public byte Slot
        {
            get => slot; set
            {
                slot = value;
                OnPropertyChanged(nameof(Slot));
            }
        }

        public int Quantity
        {
            get => quantity; set
            {
                quantity = value;
                OnPropertyChanged(nameof(Quantity));
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected virtual void OnPropertyChanged(string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
