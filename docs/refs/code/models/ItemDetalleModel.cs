using bot.viewmodel;
using bot.views.ItemStats;
using Microsoft.Maui.Controls.Platform;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.model
{
    public class ItemDetalleModel : INotifyPropertyChanged
    {
        private bool _hasBeenExecuted = false; // Bandera para controlar la ejecución
        public static PlayerViewModel? Player => App.GlobalPlayerViewModel ;
        private string? name;
        private string? type;
        private string? degree;
        private int? level;
        private uint? id;
        private string? raza;
        private string? opcionesMagicas;
        private string? adv;
        private string? lvl;
        private string? genero;
        private string? shortitem;
        private string? mountingPart;
        private byte optLevel;
        private Color? coloritemName = Colors.White;
        private Color? coloritemlVL = Colors.White;
        private string? soxtype = "Normal";
        private string? typeItem;
        private uint? durabilityactual;
        private ulong? variance;

        private View? _currentView;

        public View? CurrentView
        {
            get => _currentView;
            set
            {
                if (_currentView != value)
                {
                    _currentView = value;
                    OnPropertyChanged(nameof(CurrentView));
                }
            }
        }


        public ItemDetalleModel()
        {
         
        }

    
        public uint? Id
        {
            get => id;
            set
            {
                id = value;
                OnPropertyChanged(nameof(Id));
            }
        }
        public int? Level
        {
            get => level;
            set
            {
                if (level != value) // Evita actualizaciones innecesarias
                {
                    level = value;

                    // Actualiza otras propiedades en función del nuevo valor de `Level`
                    Lvl = value.HasValue && value.Value > 0
                        ? $"Required Level {value.Value}"
                        : string.Empty;

                    // Maneja la conversión de Player.Level con validación
                    if (int.TryParse(Player!.Level, out int playerLevel))
                    {
                        ColoritemlVL = value.HasValue && value.Value > playerLevel
                            ? Colors.Red
                            : Colors.White;
                    }
                    else
                    {
                        // Manejo de caso cuando Player.Level no es un número válido
                        ColoritemlVL = Colors.White;
                    }

                    // Notifica a los suscriptores del cambio
                    OnPropertyChanged(nameof(Level));
                    OnPropertyChanged(nameof(Lvl)); // Notifica cambios en `Lvl`
                    OnPropertyChanged(nameof(ColoritemlVL)); // Notifica cambios en `ColoritemlVL`
                }
            }
        }

        public string? Lvl
        {
            get => lvl;
            private set
            {
                if (lvl != value)
                {
                    lvl = value;
                    OnPropertyChanged(nameof(Lvl));
                }
            }
        }

        public Color? ColoritemlVL
        {
            get => coloritemlVL;
            private set
            {
                if (coloritemlVL != value)
                {
                    coloritemlVL = value;
                    OnPropertyChanged(nameof(ColoritemlVL));
                }
            }
        }

        public string? Name
        {
            get => name; set
            {
                name = value;
                OnPropertyChanged(nameof(Name));
            }
        }
        public string? Type
        {
            get => type; 
             set
            {
               
                    type = value;
                    OnPropertyChanged(nameof(Type));
                    Obtenerdetype(value);
                
            }
        }

        public string? Raza
        {
            get => raza;
            set
            {
                raza = value;
                OnPropertyChanged(nameof(Raza));
            }
        }

        public string? Degree
        {
            get => degree; set
            {
                degree = value;
                OnPropertyChanged(nameof(Degree));
            }
        }

        public string? OpcionesMagicas
        {
            get => opcionesMagicas; set
            {
                opcionesMagicas = value;
                OnPropertyChanged(nameof(OpcionesMagicas));
            }
        }

        public string? Adv
        {
            get => adv; set
            {
                adv = value;
                OnPropertyChanged(nameof(Adv));
            }
        }

      

        public string? Shortitem
        {
            get => shortitem; set
            {
                shortitem = value;
                OnPropertyChanged(nameof(Shortitem));
            }
        }

        public string? Soxtype
        {
            get => soxtype; set
            {
                soxtype = value;

                ColoritemName = value == "Sos" ? Colors.Yellow : Colors.White;
                Console.WriteLine($"camnio de color a {Soxtype}");
                OnPropertyChanged(nameof(Soxtype));
            }
        }

        public Color? ColoritemName
        {
            get => coloritemName; set
            {
                coloritemName = value;
                OnPropertyChanged(nameof(ColoritemName));
            }
        }

       

        public byte OptLevel
        {
            get => optLevel; set
            {
                optLevel = value;
                OnPropertyChanged(nameof(OptLevel));
            }
        }

        public string? MountingPart
        {
            get => mountingPart; set
            {
                mountingPart = value;
                OnPropertyChanged(nameof(MountingPart));
            }
        }

        public string? Genero
        {
            get => genero; set
            {
                genero = value;
                OnPropertyChanged(nameof(Genero));
            }
        }

        public string? TypeItem
        {
            get => typeItem; set
            {
                typeItem = value;
                OnPropertyChanged(nameof(TypeItem));
               
                ActualizarPropiedades();
            }
        }

        public uint? Durabilityactual
        {
            get => durabilityactual; set
            {
                durabilityactual = value;
                OnPropertyChanged(nameof(Durabilityactual));
              
                ActualizarPropiedades();
            }
        }
        public ulong? Variance
        {
            get => variance; set
            {
                variance = value;
                OnPropertyChanged(nameof(Variance));
                ActualizarPropiedades();
            }
        }

        private void ActualizarPropiedades()
        {
            // Verifica si todas las propiedades necesarias tienen valores
            if (Id.HasValue && !string.IsNullOrEmpty(TypeItem) && Durabilityactual.HasValue)
            {
                // Resetea la bandera si ya ha sido ejecutado para permitir la ejecución nuevamente
                _hasBeenExecuted = false;

                if (!_hasBeenExecuted)
                {
                    CambiarViewSegunTipo();
                    _hasBeenExecuted = true; // Marca como ejecutado para evitar ejecuciones innecesarias
                }
            }
            else
            {
                // Si no todas las propiedades tienen valor, no ejecuta el método
                _hasBeenExecuted = false; // Asegúrate de que la bandera se reinicie si faltan valores
            }
        }
        private void CambiarViewSegunTipo()
        {
            
            var statsViewModel = new ItemStatsViewModel
            {
                ItemId = Id ?? 0,
                Variance = Variance,
                Durabilityactual = Durabilityactual,
                TypeItem = TypeItem
            };
            // Ejemplo simple: si TypeItem es "Shield", cambia la vista a una vista personalizada
            if (TypeItem == "Shield")
            {
                var shieldView = new ItemShield();
                shieldView.BindingContext = statsViewModel;
                CurrentView = shieldView; // View personalizada para los shields
            }
            else if (TypeItem == "EuWeapon")
            {
                var EuWeapon = new ItemWeaponEu();
                EuWeapon.BindingContext = statsViewModel;
                CurrentView = EuWeapon; // View personalizada para las armas europeas
            }
            else if (TypeItem == "ChWeapon")
            {
                var ChWeapon = new ItemWeaponCh();
                ChWeapon.BindingContext = statsViewModel;
                CurrentView = ChWeapon; // View personalizada para las armas europeas
            }
            else if (TypeItem == "Joyeria")
            {
                var Joyeria = new ItemJoyeria();
                Joyeria.BindingContext = statsViewModel;
                CurrentView = Joyeria; // View personalizada para las armas europeas
            }
            else if (TypeItem == "Armadura")
            {
                var Armadura = new ItemArmadura();
                Armadura.BindingContext = statsViewModel;
                // Cambiar a una vista personalizada para armas europeas
                CurrentView = Armadura; // View personalizada para las armas europeas
            }
            else
            {
                // Vista por defecto
                CurrentView =null; // Vista por defecto si no coincide con ninguna condición
            }
        }


        private void Obtenerdetype(string? type)
        {
            type = type ?? string.Empty;
            Raza = type switch
            {
                var t when t.Contains("_CH_") => "Chinese",
                var t when t.Contains("_EU_") => "European",
                _ => string.Empty
            };

            Degree = type switch
            {
                var t when t.Contains("_01_") => "Degree: 1 degrees",
                var t when t.Contains("_02_") => "Degree: 2 degrees",
                var t when t.Contains("_03_") => "Degree: 3 degrees",
                var t when t.Contains("_04_") => "Degree: 4 degrees",
                var t when t.Contains("_05_") => "Degree: 5 degrees",
                var t when t.Contains("_06_") => "Degree: 6 degrees",
                var t when t.Contains("_07_") => "Degree: 7 degrees",
                var t when t.Contains("_08_") => "Degree: 8 degrees",
                var t when t.Contains("_09_") => "Degree: 9 degrees",
                var t when t.Contains("_10_") => "Degree: 10 degrees",
                var t when t.Contains("_11_") => "Degree: 11 degrees",
                var t when t.Contains("_12_") => "Degree: 12 degrees",
                var t when t.Contains("_13_") => "Degree: 13 degrees",
                var t when t.Contains("_14_") => "Degree: 14 degrees",
                var t when t.Contains("_15_") => "Degree: 15 degrees",
                _ => string.Empty
            };

            switch (true)
            {
                case bool _ when type.Contains("_SHIELD_"):
                    Shortitem = "Sort of item : Shield";
                    TypeItem = "Shield";
                    break;
                case bool _ when type.Contains("_DAGGER_"):
                    Shortitem = "Sort of item : Dagger";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_CH_SWORD_"):
                    Shortitem = "Sort of item : Sword";
                    TypeItem = "ChWeapon";
                    break;
                case bool _ when type.Contains("_EU_SWORD_"):
                    Shortitem = "Sort of item : Onehand sword";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_TSWORD_"):
                    Shortitem = "Sort of item : Twohand sword";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_AXE_"):
                    Shortitem = "Sort of item : Dual axe";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_CROSSBOW_"):
                    Shortitem = "Sort of item : Crossbow";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_STAFF_"):
                    Shortitem = "Sort of item : Light staff";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_TSTAFF_"):
                    Shortitem = "Sort of item : Twohand staff";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_DARKSTAFF_"):
                    Shortitem = "Sort of item : Dark staff";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_HARP_"):
                    Shortitem = "Sort of item : Harp";
                    TypeItem = "EuWeapon";
                    break;
                case bool _ when type.Contains("_BLADE_"):
                    Shortitem = "Sort of item : Blade";
                    TypeItem = "ChWeapon";
                    break;
                case bool _ when type.Contains("_TBLADE_"):
                    Shortitem = "Sort of item : Glavie";
                    TypeItem = "ChWeapon";
                    break;
                case bool _ when type.Contains("_SPEAR_"):
                    Shortitem = "Sort of item : Spear";
                    TypeItem = "ChWeapon";
                    break;
                case bool _ when type.Contains("_BOW_"):
                    Shortitem = "Sort of item : Bow";
                    TypeItem = "ChWeapon";
                    break;
                case bool _ when type.Contains("_RING_"):
                    Shortitem = "Sort of item : Ring";
                    TypeItem = "Joyeria";
                    break;
                case bool _ when type.Contains("_EARRING_"):
                    Shortitem = "Sort of item : Earring";
                    TypeItem = "Joyeria";
                    break;
                case bool _ when type.Contains("_NECKLACE_"):
                    Shortitem = "Sort of item : Necklace";
                    TypeItem = "Joyeria";
                    break;
                case bool _ when type.Contains("_CH_") && type.Contains("_HEAVY_"):
                    Shortitem = "Sort of item : Armor";
                    TypeItem = "Armadura";
                    break;
                case bool _ when type.Contains("_CH_") && type.Contains("_CLOTHES_"):
                    Shortitem = "Sort of item : Garment";
                    TypeItem = "Armadura";
                    break;
                case bool _ when type.Contains("_CH_") && type.Contains("_LIGHT_"):
                    Shortitem = "Sort of item : Protector";
                    TypeItem = "Armadura";
                    break;

                case bool _ when type.Contains("_EU_") && type.Contains("_HEAVY_"):
                    Shortitem = "Sort of item : Heavy armor";
                    TypeItem = "Armadura";
                    break;
                case bool _ when type.Contains("_EU_") && type.Contains("_CLOTHES_"):
                    Shortitem = "Sort of item : Robe";
                    TypeItem = "Armadura";
                    break;
                case bool _ when type.Contains("_EU_") && type.Contains("_LIGHT_"):
                    Shortitem = "Sort of item : Light armor";
                    TypeItem = "Armadura";
                    break;
                case bool _ when type.Contains("_ETC_AMMO_"):
                    Shortitem = "Sort of item : Arrows/Bolts";
                    break;

                default:
                    Shortitem = "";
                    break;

            }

            switch (true)
            {
                case bool _ when type.Contains("_AA_"):
                    MountingPart = "Mounting part : Hands";
                    break;
                case bool _ when type.Contains("_BA_"):
                    MountingPart = "Mounting part : Chest";
                    break;
                case bool _ when type.Contains("_CA_"):
                    MountingPart = "Mounting part : Head";
                    break;
                case bool _ when type.Contains("_FA_"):
                    MountingPart = "Mounting part : Hands";
                    break;
                case bool _ when type.Contains("_HA_"):
                    MountingPart = "Mounting part : Head";
                    break;
                case bool _ when type.Contains("_LA_"):
                    MountingPart = "Mounting part : Legs";
                    break;
                case bool _ when type.Contains("_SA_"):
                    MountingPart = "Mounting part : Shoulder";
                    break;
                default:
                    MountingPart = "";
                    break;

            }
            switch (true)
            {
                case bool _ when type.Contains("_W_"):
                    Genero = "Female";
                    break;
                case bool _ when type.Contains("_M_"):
                    Genero = "Male";
                    break;
                default:
                    Genero = "";
                    break;
            }

                    Soxtype = type.Contains("rare") ? "Sos" : "Normal";
        }




        public event PropertyChangedEventHandler? PropertyChanged;
        protected virtual void OnPropertyChanged(string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }


    }
}
