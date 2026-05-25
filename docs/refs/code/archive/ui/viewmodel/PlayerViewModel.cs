using System.ComponentModel;
using System.Collections.ObjectModel;
using System.Windows.Input;
using bot.Clases.infoclass;
using bot.model;
using CommunityToolkit.Maui.Views;
using bot.views;
using static bot.Clases.infoclass.Pets;




namespace bot.viewmodel
{
    public class PlayerViewModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        private string imgplayer = "Player/pj1919.bmp";
        private string itemsPoint;
        private string str;
        private string mp;
        private string hp;
        private string gold;
        public int startSlot = 13;
        public int endSlot = 44;
        private string @int;
        private string skillPoints;
        private string gremio;
        private int inventorysize = 44;
        private string jobAlias;
        private string ultimaConexion;
        private int _pageNumber = 1;
        public static string baseUrl = "https://anapse.github.io/srobotmovileimage/images/";
        public static string Slot_Vacio = "slotvasio.png"; // URL del icono negro por defecto
        public static string Icon_Vacio = "img_vacio.png"; // URL del icono de imagen no encontrada

        public static string NotOpenSlot = "noopenslot.png";
        public static string noImage = "no_image.png";
        public static string iconUrl = Icon_Vacio;
        public static string Name = "";
        public static int Quantity = 0;
        public static int Level_Item = 0;
        public static string Type = "";
        public static uint Id = 0;

        public ICommand ShowItemDetailsCommand { get; }
        public Command<string> PageSelectedCommand { get; }
        public Grid InventoryGrid { get; set; }
        public PlayerViewModel()
        {
            InventoryItemsTotal = new ObservableCollection<ItemInventario>();
            ShowItemDetailsCommand = new Command<byte>(async (Slot) => await ShowItemDetails(Slot));

            PageSelectedCommand = new Command<string>((param) => OnPageSelected(param));
            InventoryItems = new ObservableCollection<ItemInventario>();
            CrearPage();
            UpdateInventory();
        }

        public ItemInventario ObtenerItemPorSlot(byte slot)
        {

            // Implementar lógica para obtener el ítem basado en el slot.
            // Ejemplo simple:

            return InventoryItemsTotal.FirstOrDefault(item => item.Slot == slot);
        }
        public int PageNumber
        {
            get => _pageNumber;
            set
            {
                if (_pageNumber != value)
                {
                    _pageNumber = value;
                    OnPropertyChanged(nameof(PageNumber));
                }
            }
        }

        private async Task ShowItemDetails(byte Slot)
        {
            Console.WriteLine("este es el slot q llega "+Slot);
            // Crea el ViewModel del Popup, pasándole el itemId
            var viewModel = new ItemDetailsPopupViewModel(Slot);

            // Crea la instancia del Popup y pásale el ViewModel
            var popup = new ItemDetallesPopup(viewModel);
            if (Slot >= 0)
            {

                // Muestra el Popup
                var page = Application.Current?.Windows.FirstOrDefault()?.Page
                     ?? new ContentPage();
                await page.ShowPopupAsync(popup);
                // Muestra el Popup
            }

        }
        public void CrearPage()
        {

            if (Inventorysize <= 44)
            {
                GeneratePages(1);
            }
            else if (Inventorysize <= 76)
            {
                GeneratePages(2);
            }
            else
            {
                GeneratePages(3);
            }
        }
        public ObservableCollection<PageModel> PageNumbers { get; set; }

        public void GeneratePages(int pageCount)
        {

            PageNumbers = new ObservableCollection<PageModel>();

            for (int i = 1; i <= pageCount; i++)
            {

                PageNumbers.Add(new PageModel { PageName = $"Page {i}", IsActive = (i == 1) });
            }

            OnPropertyChanged(nameof(PageNumbers));
        }


        private void OnPageSelected(string pageName)
        {
            var selectedPage = PageNumbers.FirstOrDefault(p => p.PageName == pageName);
            if (selectedPage == null) return;

            foreach (var page in PageNumbers)
            {
                page.IsActive = page == selectedPage;
            }

            PageNumber = int.Parse(selectedPage.PageName.Split(' ')[1]);


            OnPropertyChanged(nameof(PageNumber));

            switch (PageNumber)
            {
                case 1:
                    StartSlot = 13;
                    EndSlot = 44;

                    break;
                case 2:
                    StartSlot = 45;
                    EndSlot = 76;

                    break;
                case 3:
                    StartSlot = 77;
                    EndSlot = 108;

                    break;
            }
            CargarPaginas(StartSlot, EndSlot);

        }
        public void CargarPaginas(int slotInicio, int slotFin)
        {
            // Filtrar los ítems en el rango de slots especificado por los parámetros
            var itemsEnRango = InventoryItemsTotal
                .Where(item => item.Slot >= slotInicio && item.Slot <= slotFin)
                .ToList();

            // Cargar estos ítems en la lista `InventoryItems`
            InventoryItems.Clear();
            foreach (var item in itemsEnRango)
            {
                InventoryItems.Add(item);
            }
        }

        private ObservableCollection<ItemInventario> inventoryItems;

        public ObservableCollection<ItemInventario> InventoryItems
        {
            get { return inventoryItems; }
            set
            {
                inventoryItems = value;
                OnPropertyChanged(nameof(InventoryItems));
            }
        }

        private ObservableCollection<ItemInventario> inventoryItemsTotal;

        public ObservableCollection<ItemInventario> InventoryItemsTotal
        {
            get { return inventoryItemsTotal; }
            set
            {
                inventoryItemsTotal = value;
                OnPropertyChanged(nameof(InventoryItemsTotal));
            }
        }


        public void UpdateInventory()
        {
            InventoryItemsTotal.Clear();
            for (int i = 0; i <= Inventorysize; i++)
            {
                Slot_Vacio = Inventorysize >= i ? Slot_Vacio : NotOpenSlot;
                ImageSource iconSource = i <= 12 ? "img_vacio2.png" : Icon_Vacio;
                if (Data.inventory.TryGetValue((byte)i, out DataItemInventory itemData))
                {
                    string relativePath = itemData.Icon;
                    relativePath = relativePath.Replace('\\', '/').Replace(".ddj", ".png").ToLower();
                    iconUrl = new Uri(new Uri(baseUrl), relativePath).ToString();
                    Quantity = itemData.Count;
                    Id = itemData.ItemRefItemID;
                    iconSource = ImageSource.FromUri(new Uri(iconUrl));
                }

                try
                {
                    InventoryItemsTotal.Add(new ItemInventario
                    {
                        Slot = (byte)i,
                        Quantity = Quantity,
                        Icon = iconSource,
                        Id = Id,
                        InventarioSlot = Slot_Vacio
                    });
                }
                catch (Exception ex)
                {

                    Console.WriteLine($"Error cargando imagen '{iconUrl}': {ex.Message}");
                    ImageSource fallbackIcon = noImage;

                    InventoryItemsTotal.Add(new ItemInventario
                    {
                        Slot = (byte)i,
                        Quantity = Quantity,
                        Icon = fallbackIcon,
                        Id = Id,
                        InventarioSlot = Slot_Vacio
                    });
                }
            }


            CargarTodosLosSlots();

            CargarPaginas(StartSlot, EndSlot);
        }



        public string Imgplayer
        {
            get => imgplayer;
            set
            {
                if (imgplayer != value)
                {
                    imgplayer = value;

                    OnPropertyChanged(nameof(Imgplayer));
                }
            }
        }
        public int refObjID;
        public int RefObjID
        {
            get => refObjID;
            set
            {
                if (refObjID != value)
                {
                    refObjID = value;
                    OnPropertyChanged(nameof(RefObjID));
                    Imgraza = refObjID > 10000 ? "race_euro.png" : "race_china.png";
                    UpdateImgplayer(RefObjID.ToString());
                }
            }
        }
        public string imgraza;
        public string Imgraza
        {
            get => imgraza;
            set
            {
                if (imgraza != value)
                {
                    imgraza = value;
                    OnPropertyChanged(nameof(Imgraza));
                }
            }
        }



        public string PlayerName
        {
            get => playerName;
            set
            {
                if (playerName != value)
                {
                    playerName = value;
                    OnPropertyChanged(nameof(PlayerName));
                }
            }
        }
        public string expbarra;
        public string Expbarra
        {
            get => expbarra;
            set
            {
                if (expbarra != value)
                {
                    expbarra = value;
                    OnPropertyChanged(nameof(Expbarra));
                }
            }
        }

        public ulong ExpOffset
        {
            get => expOffset;
            set
            {
                if (expOffset != value)
                {
                    expOffset = value;
                    OnPropertyChanged(nameof(ExpOffset));
                    EXP = ((ExpOffset * 100) / Caracter.ExpMax).ToString();

                }
            }
        }
        public string EXP
        {
            get => exp;
            set
            {
                if (exp != value)
                {
                    exp = value;
                    OnPropertyChanged(nameof(EXP));

                    if (int.TryParse(exp, out int intValue))
                    {
                        Expbarra = (intValue * 3).ToString();
                    }
                    else
                    {
                        Expbarra = "0";
                    }

                }
            }
        }



        public byte JobType
        {
            get => jobType;
            set
            {
                if (jobType != value)
                {
                    jobType = value;
                    JobDescription = jobType == 1 ? "Trader" :
                               jobType == 2 ? "Thief" :
                               jobType == 3 ? "Hunter" : "None";
                    OnPropertyChanged(nameof(JobType));
                }
            }
        }

        public string JobDescription
        {
            get => jobDescription;
            set
            {
                if (jobDescription != value)
                {
                    jobDescription = value;
                    OnPropertyChanged(nameof(JobDescription));
                }
            }
        }

        public string HP
        {
            get => hp;
            set
            {
                if (hp != value)
                {
                    hp = value;
                    OnPropertyChanged(nameof(HP));
                }
            }
        }

        public string MP
        {
            get => mp;
            set
            {
                if (mp != value)
                {
                    mp = value;
                    OnPropertyChanged(nameof(MP));
                }
            }
        }

        public string Gold
        {
            get => gold;
            set
            {
                if (gold != value)
                {
                    gold = value;
                    OnPropertyChanged(nameof(Gold));
                }
            }
        }

        private string level;
        private string playerName;
        private string jobDescription;
        private byte jobType;
        private string exp;
        private ulong expOffset;

        public string Level
        {
            get => level;
            set
            {
                if (level != value)
                {
                    level = value;
                    OnPropertyChanged(nameof(Level));
                }
            }
        }
        public string ItemsPoint
        {
            get => itemsPoint;
            set
            {
                if (itemsPoint != value)
                {
                    itemsPoint = value;
                    OnPropertyChanged(nameof(ItemsPoint));
                }
            }
        }

        public string STR
        {
            get => str;
            set
            {
                if (str != value)
                {
                    str = value;
                    OnPropertyChanged(nameof(STR));
                }
            }
        }

        public string INT
        {
            get => @int;
            set
            {
                if (@int != value)
                {
                    @int = value;
                    OnPropertyChanged(nameof(INT));
                }
            }
        }

        public string SkillPoints
        {
            get => skillPoints;
            set
            {
                if (skillPoints != value)
                {
                    skillPoints = value;
                    OnPropertyChanged(nameof(SkillPoints));
                }
            }
        }

        public string Gremio
        {
            get => gremio;
            set
            {
                if (gremio != value)
                {
                    gremio = value;
                    OnPropertyChanged(nameof(Gremio));
                }
            }
        }



        public string JobAlias
        {
            get => jobAlias;
            set
            {
                if (jobAlias != value)
                {
                    jobAlias = value;
                    OnPropertyChanged(nameof(JobAlias));
                }
            }
        }

        public string UltimaConexion
        {
            get => ultimaConexion;
            set
            {
                if (ultimaConexion != value)
                {
                    ultimaConexion = value;
                    OnPropertyChanged(nameof(UltimaConexion));
                }
            }
        }

        public int StartSlot
        {
            get => startSlot; set
            {
                startSlot = value;
                OnPropertyChanged(nameof(StartSlot));
            }
        }
        public int EndSlot
        {
            get => endSlot; set
            {
                endSlot = value;
                OnPropertyChanged(nameof(EndSlot));
            }
        }

        public int Inventorysize
        {
            get => inventorysize;

            set
            {
                inventorysize = value;

                OnPropertyChanged(nameof(Inventorysize));
                CrearPage();
            }
        }
        private ItemInventario slot0;
        public ItemInventario Slot0
        {
            get { return slot0; }
            set
            {
                slot0 = value;
                OnPropertyChanged(nameof(Slot0));
            }
        }

        private ItemInventario slot1;
        public ItemInventario Slot1
        {
            get { return slot1; }
            set
            {
                slot1 = value;
                OnPropertyChanged(nameof(Slot1));
            }
        }

        private ItemInventario slot2;
        public ItemInventario Slot2
        {
            get { return slot2; }
            set
            {
                slot2 = value;
                OnPropertyChanged(nameof(Slot2));
            }
        }

        private ItemInventario slot3;
        public ItemInventario Slot3
        {
            get { return slot3; }
            set
            {
                slot3 = value;
                OnPropertyChanged(nameof(Slot3));
            }
        }

        private ItemInventario slot4;
        public ItemInventario Slot4
        {
            get { return slot4; }
            set
            {
                slot4 = value;
                OnPropertyChanged(nameof(Slot4));
            }
        }

        private ItemInventario slot5;
        public ItemInventario Slot5
        {
            get { return slot5; }
            set
            {
                slot5 = value;
                OnPropertyChanged(nameof(Slot5));
            }
        }

        private ItemInventario slot6;
        public ItemInventario Slot6
        {
            get { return slot6; }
            set
            {
                slot6 = value;
                OnPropertyChanged(nameof(Slot6));
            }
        }

        private ItemInventario slot7;
        public ItemInventario Slot7
        {
            get { return slot7; }
            set
            {
                slot7 = value;
                OnPropertyChanged(nameof(Slot7));
            }
        }

        private ItemInventario slot8;
        public ItemInventario Slot8
        {
            get { return slot8; }
            set
            {
                slot8 = value;
                OnPropertyChanged(nameof(Slot8));
            }
        }

        private ItemInventario slot9;
        public ItemInventario Slot9
        {
            get { return slot9; }
            set
            {
                slot9 = value;
                OnPropertyChanged(nameof(Slot9));
            }
        }

        private ItemInventario slot10;
        public ItemInventario Slot10
        {
            get { return slot10; }
            set
            {
                slot10 = value;
                OnPropertyChanged(nameof(Slot10));
            }
        }

        private ItemInventario slot11;
        public ItemInventario Slot11
        {
            get { return slot11; }
            set
            {
                slot11 = value;
                OnPropertyChanged(nameof(Slot11));
            }
        }

        private ItemInventario slot12;
        public ItemInventario Slot12
        {
            get { return slot12; }
            set
            {
                slot12 = value;
                OnPropertyChanged(nameof(Slot12));
            }
        }

        // Constructor


        // Método para cargar un ítem en un slot
        public void CargarItemEnSlot(int slot, ItemInventario item)
        {

            switch (slot)
            {
                case 0:
                    Slot0 = item;
                    break;
                case 1:
                    Slot1 = item;
                    break;
                case 2:
                    Slot2 = item;
                    break;
                case 3:
                    Slot3 = item;
                    break;
                case 4:
                    Slot4 = item;
                    break;
                case 5:
                    Slot5 = item;
                    break;
                case 6:
                    Slot6 = item;
                    break;
                case 7:
                    Slot7 = item;
                    break;
                case 8:
                    Slot8 = item;
                    break;
                case 9:
                    Slot9 = item;
                    break;
                case 10:
                    Slot10 = item;
                    break;
                case 11:
                    Slot11 = item;
                    break;
                case 12:
                    Slot12 = item;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(slot), "Número de slot no válido.");
            }
        }

        // Método para obtener un ítem por slot


        // Método para cargar todos los ítems en sus respectivos slots
        public void CargarTodosLosSlots()
        {
            for (int i = 0; i < 13; i++)
            {

                CargarItemEnSlot(i, ObtenerItemPorSlot((byte)i));
            }
        }
        public void UpdateImgplayer(string RefObjID)
        {
            Imgplayer = "Player/pj" + RefObjID + ".bmp";
        }

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
