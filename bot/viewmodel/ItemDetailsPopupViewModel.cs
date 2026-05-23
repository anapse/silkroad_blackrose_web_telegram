using bot.Clases.infoclass;
using bot.model;
using bot.views;
using CommunityToolkit.Maui.Views;
using System.ComponentModel;
using System.Xml.Linq;



namespace bot.viewmodel
{
    public class ItemDetailsPopupViewModel : INotifyPropertyChanged
    {

        private ItemDetalleModel? _item;

        public ItemDetalleModel? Item
        {
            get => _item;
            private set
            {
                _item = value;
                OnPropertyChanged(nameof(Item));
            }
        }

        public ItemDetailsPopupViewModel(byte Slot)
        {
            LoadItemDetails(Slot);
        }

        public void LoadItemDetails(byte Slot)
        {
            // Buscar el índice del ítem en la lista utilizando el ID
            if (Data.inventory.TryGetValue(Slot, out DataItemInventory? itemData))
            {
                Console.WriteLine($"el Durabilityactual de item es2 {itemData.Durability}");
                // Crear un objeto ItemDetalleModel con los detalles del ítem
                var item = new ItemDetalleModel
                {
                    Id = itemData.ItemRefItemID,
                    Name = itemData.Name,
                    Level = itemData.Level,
                    Type = itemData.CodeName,
                    OptLevel= itemData.OptLevel,
                    Variance = itemData.Variance,
                    Durabilityactual = itemData.Durability
                };
                Item = item;
                ;
            }
            else
            {
                // Manejar el caso donde no se encuentre el ítem
                var item = new ItemDetalleModel
                {
                    Id = itemData?.ItemRefItemID,
                    Name = "Desconocido",
                    Level = 0,
                    Type = "Desconocido",
                    OptLevel = 0,
                    Variance = 0,
                    Durabilityactual= 0
                };
                Item = item;
            }

        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged(string propertyName) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
