

using bot.Clases.infoclass.Items;
using System.ComponentModel;
using System.Runtime.CompilerServices;


   

    namespace bot.viewmodel
    {
        public class ItemStatsViewModel : INotifyPropertyChanged
        {
            private uint itemId;
            private uint? durabilityactual;
            private ulong? variance;
            private string durabilidad;

            // Propiedades para las estadísticas calculadas
            private int physicalDamage;
            private int magicalDamage;
            private int durability;
            private string hitRatio;
            private string critical;
        private string range;
        private string physicalReinforce;
            private string magicalReinforce;
            private int physicalDefensive;
            private int magicalDefensive;
            private string blockRatio;
            private string parryRatio;
            private int physicalAbsorption;
            private int magicalAbsorption;
        private string? typeItem;

        public uint ItemId
            {
                get => itemId;
                set
                {
                    if (itemId != value)
                    {
                        itemId = value;
                        OnPropertyChanged();
                        
                    }
                }
            }
        public string? TypeItem
        {
            get => typeItem; set
            {
                typeItem = value;
                OnPropertyChanged(nameof(TypeItem));
                CalculateStats();
            }
        }
            public uint? Durabilityactual
            {
                get => durabilityactual;
                set
                {
                    durabilityactual = value;
                    OnPropertyChanged(nameof(Durabilityactual));
                   
                }
            }

            public ulong? Variance
            {
                get => variance;
                set
                {
                    variance = value;
                    OnPropertyChanged(nameof(Variance));
              
                }
            }
        public string Range
        {
            get => range;
            set
            {
                range = value;
                OnPropertyChanged(nameof(Range));
            }
        }
        public string Durabilidad
            {
                get => durabilidad;
                set
                {
                    durabilidad = value;
                    OnPropertyChanged(nameof(Durabilidad));
                }
            }

        
            public int PhysicalDamage
            {
                get => physicalDamage;
                private set
                {
                    if (physicalDamage != value)
                    {
                        physicalDamage = value;
                        OnPropertyChanged(nameof(PhysicalDamage));
                    }
                }
            }

            public int MagicalDamage
            {
                get => magicalDamage;
                private set
                {
                    if (magicalDamage != value)
                    {
                        magicalDamage = value;
                        OnPropertyChanged(nameof(MagicalDamage));
                    }
                }
            }

            public int Durability
            {
                get => durability;
                private set
                {
               
                    durability = value;
                    OnPropertyChanged(nameof(Durability));
                    if (Durabilityactual.HasValue)
                    {
                        Durabilidad = $"{Durabilityactual.Value}/{ItemDataStatsCalculator.CalculadorSegunPorcentaje("durabilidad",ItemId, Durability)}";
                    }
                   
                
            }
            }

            public string HitRatio
            {
                get => hitRatio;
                private set
                {
                    if (hitRatio != value)
                    {
                        hitRatio = value;
                        OnPropertyChanged(nameof(HitRatio));
                    }
                }
            }

            public string Critical
            {
                get => critical;
                private set
                {
                    if (critical != value)
                    {
                        critical = value;
                        OnPropertyChanged(nameof(Critical));

                    }
                }
            }
      

        public string PhysicalReinforce
            {
                get => physicalReinforce;
                private set
                {
                    if (physicalReinforce != value)
                    {
                        physicalReinforce = value;
                        OnPropertyChanged(nameof(PhysicalReinforce));
                    }
                }
            }

            public string MagicalReinforce
            {
                get => magicalReinforce;
                private set
                {
                    if (magicalReinforce != value)
                    {
                        magicalReinforce = value;
                        OnPropertyChanged(nameof(MagicalReinforce));
                    }
                }
            }

            public int PhysicalDefensive
            {
                get => physicalDefensive;
                private set
                {
                    if (physicalDefensive != value)
                    {
                        physicalDefensive = value;
                        OnPropertyChanged(nameof(PhysicalDefensive));
                    }
                }
            }

            public int MagicalDefensive
            {
                get => magicalDefensive;
                private set
                {
                    if (magicalDefensive != value)
                    {
                        magicalDefensive = value;
                        OnPropertyChanged(nameof(MagicalDefensive));
                    }
                }
            }

            public string BlockRatio
            {
                get => blockRatio;
                private set
                {
                    if (blockRatio != value)
                    {
                        blockRatio = value;
                        OnPropertyChanged(nameof(BlockRatio));
                    }
                }
            }

            public string ParryRatio
            {
                get => parryRatio;
                private set
                {
                    if (parryRatio != value)
                    {
                        parryRatio = value;
                        OnPropertyChanged(nameof(ParryRatio));
                    }
                }
            }

            public int PhysicalAbsorption
            {
                get => physicalAbsorption;
                private set
                {
                    if (physicalAbsorption != value)
                    {
                        physicalAbsorption = value;
                        OnPropertyChanged(nameof(PhysicalAbsorption));
                    }
                }
            }

            public int MagicalAbsorption
            {
                get => magicalAbsorption;
                private set
                {
                    if (magicalAbsorption != value)
                    {
                        magicalAbsorption = value;
                        OnPropertyChanged(nameof(MagicalAbsorption));
                    }
                }
            }

            public ItemStatsViewModel()
            {
                // Inicializar con valores predeterminados si es necesario
            }

        private void CalculateStats()
        {
            try
            {
                ItemType itemType = GetItemType();
                if (Variance.HasValue)
                {
                    ulong varianceUlong = (ulong)Variance.Value;
                    // Crear una instancia del calculador
                    var calculator = new ItemStatsCalculator();

                    // Calcular las estadísticas
                    var stats = calculator.CalculateStats(varianceUlong, itemType);

                    // Asignar los valores calculados a las propiedades
                    PhysicalDamage = stats.PhysicalDamage;
                    MagicalDamage = stats.MagicalDamage;
                    Durability = stats.Durability;
                    HitRatio = ItemDataStatsCalculator.CalculadorSegunPorcentaje("hit", ItemId, stats.HitRatio);
                    Critical = ItemDataStatsCalculator.CalculadorSegunPorcentaje("critical", ItemId, stats.Critical);
                    PhysicalReinforce = ItemDataStatsCalculator.CalculadorSegunPorcentaje("phyreinfo", ItemId, stats.PhysicalReinforce);
                    MagicalReinforce = ItemDataStatsCalculator.CalculadorSegunPorcentaje("magreinfo", ItemId, stats.MagicalReinforce);
                    PhysicalDefensive = stats.PhysicalDefensive;
                    MagicalDefensive = stats.MagicalDefensive;
                    BlockRatio = ItemDataStatsCalculator.CalculadorSegunPorcentaje("bloqueo", ItemId, stats.BlockRatio);
                    ParryRatio = ItemDataStatsCalculator.CalculadorSegunPorcentaje("parry", ItemId, stats.ParryRatio);
                    PhysicalAbsorption = stats.PhysicalAbsorption;
                    MagicalAbsorption = stats.MagicalAbsorption;
                    Range = ItemDataStatsCalculator.CalculadorSegunPorcentaje("range", ItemId, 100);

                }
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"Error: aqui {ex.Message}"); // Imprime el mensaje de la excepción
            }
            Console.WriteLine($"este esl el valos de durabilidad {Durability}");
        }



        private ItemType GetItemType()
        {
            if (string.IsNullOrEmpty(TypeItem))
            {
                throw new InvalidOperationException("INVALID TYPE! TypeItem is null or empty");
            }

            // Imprimir el valor de TypeItem antes de procesarlo
            Console.WriteLine($"Evaluando TypeItem: '{TypeItem}'");

            return TypeItem switch
            {
                "Shield" => ItemType.Shield,
                "ChWeapon" => ItemType.Weapon,
                "EuWeapon" => ItemType.Weapon,
                "Joyeria" => ItemType.Accessory,
                "Armadura" => ItemType.Equipment,
                _ => throw new InvalidOperationException($"INVALID TYPE! TypeItem: {TypeItem}") // Detalla el valor del tipo
            };
        }


        public event PropertyChangedEventHandler? PropertyChanged;
            protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
            {
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
            }
        }
    }


