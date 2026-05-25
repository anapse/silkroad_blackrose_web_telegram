using bot.Clases.infoclass;
using CommunityToolkit.Maui.Alerts;
using CommunityToolkit.Maui.Core;
using System.Diagnostics;
using bot.model;
using System.Xml;
using Newtonsoft.Json;


namespace bot.Clases
{


    class LoadTXT
    {
       


        private static async Task ShowToast(string message)
        {
            var toast = Toast.Make(message, ToastDuration.Short, 14);
            await toast.Show();
        }


        public static async Task LoadDataAsync()
        {
          
            // Solicitar permiso de almacenamiento
            var status = await Permissions.RequestAsync<Permissions.StorageWrite>();
            if (status != PermissionStatus.Granted)
            {
                await ShowToast("No se ha concedido permiso para acceder al almacenamiento.");
                return;
            }
            Stopwatch stopwatch = new Stopwatch();
            stopwatch.Start();
            await ShowToast("Loading Silkroad data . . .");
            Data.InitializeTypes();
            Data.LoadShopTabData();
            try
            {
                Data.Itemdatatext = await LoadDictionaryAsync("itemdatatext.json") ?? new Dictionary<string, ItemData>();
                Items_Info.itemsidlist = await LoadDataAsync<List<uint>>("itemsidlist.json") ?? new List<uint>();
                Items_Info.itemstypelist = await LoadDataAsync<List<string>>("itemstypelist.json") ?? new List<string>();
                Items_Info.itemsnamelist = await LoadDataAsync<List<string>>("itemsnamelist.json") ?? new List<string>();
                Items_Info.itemslevellist = await LoadDataAsync<List<byte>>("itemslevellist.json") ?? new List<byte>();
                Items_Info.items_iconlist = await LoadDataAsync<List<string>>("items_iconlist.json") ?? new List<string>();
                Items_Info.items_maxlist = await LoadDataAsync<List<ushort>>("items_maxlist.json") ?? new List<ushort>();
                Items_Info.itemsdurabilitylist = await LoadDataAsync<List<uint>>("itemsdurabilitylist.json") ?? new List<uint>();
                Spawns.NPCID = await LoadDataAsync<List<uint>>("NPCID.json") ?? new List<uint>();
                Spawns.NPCType = await LoadDataAsync<List<string>>("NPCType.json") ?? new List<string>();
                Mobs_Info.mobsidlist = await LoadDataAsync<List<uint>>("mobsidlist.json") ?? new List<uint>();
                Mobs_Info.mobstypelist = await LoadDataAsync<List<string>>("mobstypelist.json") ?? new List<string>();
                Mobs_Info.mobsnamelist = await LoadDataAsync<List<string>>("mobsnamelist.json") ?? new List<string>();
                Mobs_Info.mobshplist = await LoadDataAsync<List<uint>>("mobshplist.json") ?? new List<uint>();
                Mobs_Info.mobslevellist = await LoadDataAsync<List<byte>>("mobslevellist.json") ?? new List<byte>();

                // Listas de Monster
                Monster.ModTypeList = await LoadDataAsync<List<string>>("MonsterModTypeList.json") ?? new List<string>();
                Monster.ModNameList = await LoadDataAsync<List<string>>("MonsterModNameList.json") ?? new List<string>();

                // Lista de experiencia
                Caracter.explist = await LoadDataAsync<List<string>>("Caracterexplist.json") ?? new List<string>();

                // Verificar si todas las listas tienen datos
                bool allListsHaveData = Items_Info.itemsidlist.Count > 0 &&
                                        Items_Info.itemstypelist.Count > 0 &&
                                        Items_Info.itemsnamelist.Count > 0 &&
                                        Items_Info.itemslevellist.Count > 0 &&
                                        Items_Info.items_iconlist.Count > 0 &&
                                        Items_Info.items_maxlist.Count > 0 &&
                                        Items_Info.itemsdurabilitylist.Count > 0 &&
                                        Spawns.NPCID.Count > 0 &&
                                        Spawns.NPCType.Count > 0 &&
                                        Mobs_Info.mobsidlist.Count > 0 &&
                                        Mobs_Info.mobstypelist.Count > 0 &&
                                        Mobs_Info.mobsnamelist.Count > 0 &&
                                        Mobs_Info.mobshplist.Count > 0 &&
                                        Mobs_Info.mobslevellist.Count > 0 &&
                                        Monster.ModTypeList.Count > 0 &&
                                        Monster.ModNameList.Count > 0 &&
                                        Caracter.explist.Count > 0 &&
                                        Data.Itemdatatext.Count>0;
                if (!allListsHaveData)
                {
                    await ShowToast("cargando datos desde archivos txt");
                    // Cargar los datos desde los archivos de texto como se hace actualmente
                    await LoadDatadetextoAsync();

                }
            }
            catch { }
            finally
            {

                stopwatch.Stop(); // Detiene el cronómetro
                TimeSpan elapsed = stopwatch.Elapsed; // Obtiene el tiempo transcurrido

                Debug.WriteLine($"Total time taken: {elapsed.TotalMilliseconds} milliseconds.");
                Debug.WriteLine("Successfully loaded data!");
                App.MainViewModel.DatosCargados();
            }
        }
        public static async Task LoadDatadetextoAsync()
        {

            // Cargar los datos de referencia y nombres reales
            try
            {
                await LoadReferenceDataAsync("textdata_object.txt", Item_RealName.referenceNames1, Item_RealName.realNames1);
                await LoadReferenceDataAsync("textdata_equipskill.txt", Item_RealName.referenceNames2, Item_RealName.realNames2);

                Debug.WriteLine($"Loaded {Item_RealName.referenceNames1.Count} reference names from textdata_object.txt");
                Debug.WriteLine($"Loaded {Item_RealName.referenceNames2.Count} reference names from textdata_equipskill.txt");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error loading reference data: {ex.Message}");
            }

            // Cargar los datos de ítems
            try
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, "itemdata.txt");

                using (TextReader tr = new StreamReader(filePath))
                {
                    string input;
                    while ((input = tr.ReadLine()) != null)
                    {
                        if (!string.IsNullOrWhiteSpace(input) && !input.StartsWith("//"))
                        {
                            string[] txt = input.Split('\t');
                            CrearItemData(txt);
                            if (txt.Length >= 65 && !txt.Any(string.IsNullOrWhiteSpace))
                            {
                                try
                                {
                                    // Procesar y agregar datos de ítems
                                    Items_Info.itemsidlist.Add(Globals.String_To_UInt32(txt[1]));
                                    Items_Info.itemstypelist.Add(txt[2]);

                                    // Buscar el nombre real del ítem
                                    string realName = FindRealName(txt[5]);
                                    Items_Info.itemsnamelist.Add(realName);

                                    // Procesar otros datos de ítems
                                    if (byte.TryParse(txt[33], out byte level))
                                    {
                                        byte convertedLevel = level < 0 ? (byte)1 : (byte)level;
                                        Items_Info.itemslevellist.Add(convertedLevel);
                                    }
                                    else
                                    {
#if DEBUG
                                        Debug.WriteLine($"Level conversion failed for: {txt[33]}");
#endif
                                    }
                                    Items_Info.items_iconlist.Add(txt[54]);
                                    Items_Info.items_maxlist.Add(Convert.ToUInt16(txt[57]));

                                    if (double.TryParse(txt[64], out double durability))
                                    {
                                        Items_Info.itemsdurabilitylist.Add(Convert.ToUInt32(durability));
                                    }
                                    else
                                    {
#if DEBUG
                                        Debug.WriteLine($"Durability format error: {txt[64]}");
#endif
                                    }

                                    // Simplificación de agrupación de ítems
                                    AdvanceItem Item = new AdvanceItem(txt[2], txt[5], Convert.ToByte(txt[33]), "Ignore");
                                    AdvanceItem.Allitems.Add(Item);
                                    CategorizeItem(Item, txt[2]);
                                }
                                catch (IndexOutOfRangeException ex)
                                {
#if DEBUG
                                    Debug.WriteLine($"IndexOutOfRangeException: {ex.Message}");
#endif
                                }
                                catch (Exception ex)
                                {
#if DEBUG
                                    Debug.WriteLine($"Error processing line: {ex.Message}");
                                    Debug.WriteLine($"Line: {input}");
#endif
                                }
                            }
                            else
                            {
#if DEBUG
                                Debug.WriteLine("Error: Insufficient number of elements in the array.");
#endif
                            }
                        }
                    }
                }


            }
            catch (Exception ex)
            {
#if DEBUG
                Debug.WriteLine($"Exception: {ex.Message}");
#endif

            }


            #region Truong An
            Spawns.NPCID.Add(240);
            Spawns.NPCType.Add("NPC_CH_POTION");
            Spawns.NPCID.Add(28);
            Spawns.NPCType.Add("NPC_CH_SMITH");
            Spawns.NPCID.Add(157);
            Spawns.NPCType.Add("NPC_CH_WAREHOUSE");
            Spawns.NPCID.Add(213);
            Spawns.NPCType.Add("NPC_CH_ACCESSORY");
            Spawns.NPCID.Add(191);
            Spawns.NPCType.Add("NPC_CH_HORSE");
            Spawns.NPCID.Add(48);
            Spawns.NPCType.Add("NPC_CH_ARMOR");
            Spawns.NPCID.Add(290);
            Spawns.NPCType.Add("NPC_CH_DOCTOR");
            #endregion

            #region Don Hoang
            Spawns.NPCID.Add(226);
            Spawns.NPCType.Add("NPC_WC_SMITH");
            Spawns.NPCID.Add(117);
            Spawns.NPCType.Add("NPC_WC_ARMOR");
            Spawns.NPCID.Add(47);
            Spawns.NPCType.Add("NPC_WC_ACCESSORY");
            Spawns.NPCID.Add(71);
            Spawns.NPCType.Add("NPC_WC_POTION");
            Spawns.NPCID.Add(27);
            Spawns.NPCType.Add("NPC_WC_HORSE");
            Spawns.NPCID.Add(267);
            Spawns.NPCType.Add("NPC_WC_GACHA_OPERATOR");
            Spawns.NPCID.Add(116);
            Spawns.NPCType.Add("NPC_WC_WAREHOUSE_M");
            Spawns.NPCID.Add(99);
            Spawns.NPCType.Add("NPC_WC_WAREHOUSE_W");
            #endregion

            #region Hoa Dien
            Spawns.NPCID.Add(541);
            Spawns.NPCType.Add("NPC_KT_ACCESSORY");
            Spawns.NPCID.Add(129);
            Spawns.NPCType.Add("NPC_KT_ARMOR");
            Spawns.NPCID.Add(22);
            Spawns.NPCType.Add("NPC_KT_SMITH");
            Spawns.NPCID.Add(105);
            Spawns.NPCType.Add("NPC_KT_POTION");
            Spawns.NPCID.Add(532);
            Spawns.NPCType.Add("NPC_KT_DESIGNER");
            Spawns.NPCID.Add(512);
            Spawns.NPCType.Add("NPC_KT_HORSE");
            Spawns.NPCID.Add(633);
            Spawns.NPCType.Add("NPC_KT_GACHA_OPERATOR");
            Spawns.NPCID.Add(495);
            Spawns.NPCType.Add("NPC_KT_WAREHOUSE");
            #endregion

            #region Samarkand
            Spawns.NPCID.Add(764);
            Spawns.NPCType.Add("NPC_CA_WAREHOUSE");
            Spawns.NPCID.Add(740);
            Spawns.NPCType.Add("NPC_CA_ACCESSORY");
            Spawns.NPCID.Add(714);
            Spawns.NPCType.Add("NPC_CA_POTION");
            Spawns.NPCID.Add(605);
            Spawns.NPCType.Add("NPC_CA_ARMOR");
            Spawns.NPCID.Add(573);
            Spawns.NPCType.Add("NPC_CA_SMITH");
            Spawns.NPCID.Add(796);
            Spawns.NPCType.Add("NPC_CA_HORSE");
            Spawns.NPCID.Add(781);
            Spawns.NPCType.Add("NPC_CA_SPECIAL");
            Spawns.NPCID.Add(832);
            Spawns.NPCType.Add("NPC_CH_GACHA_MACHINE");
            Spawns.NPCID.Add(786);
            Spawns.NPCType.Add("NPC_CA_MERCHANT");
            #endregion

            #region
            Spawns.NPCID.Add(308);
            Spawns.NPCType.Add("NPC_EU_SMITH");
            Spawns.NPCID.Add(516);
            Spawns.NPCType.Add("NPC_EU_POTION");
            Spawns.NPCID.Add(498);
            Spawns.NPCType.Add("NPC_EU_WAREHOUSE");
            Spawns.NPCID.Add(471);
            Spawns.NPCType.Add("NPC_EU_ACCESSORY");
            Spawns.NPCID.Add(552);
            Spawns.NPCType.Add("NPC_EU_SPECIAL");
            Spawns.NPCID.Add(558);
            Spawns.NPCType.Add("NPC_EU_GACHA_OPERATOR");
            Spawns.NPCID.Add(547);
            Spawns.NPCType.Add("NPC_EU_MERCHANT");
            Spawns.NPCID.Add(451);
            Spawns.NPCType.Add("NPC_EU_HORSE");
            #endregion
#if DEBUG  ///CARACTERDATA
            try
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, "characterdata.txt");

                using TextReader tr = new StreamReader(filePath);
                string input;
                while ((input = tr.ReadLine()) != null)
                {
                    if (!string.IsNullOrWhiteSpace(input) && !input.StartsWith("//"))
                    {
                        string[] txt = input.Split('\t');
                        if (txt.Length >= 65 && !txt.Any(string.IsNullOrWhiteSpace))
                        {
                            Mobs_Info.mobsidlist.Add(Globals.String_To_UInt32(txt[1]));
                            Mobs_Info.mobstypelist.Add(txt[2]);
                            Mobs_Info.mobsnamelist.Add(txt[5]);
                            Mobs_Info.mobshplist.Add(Convert.ToUInt32(txt[63]));
                            Mobs_Info.mobslevellist.Add(Convert.ToByte(txt[61]));
                        }
                        if (txt[2].StartsWith("MOB"))
                        {
                            Monster.ModTypeList.Add(txt[2]);
                            Monster.ModNameList.Add(txt[5]);
                        }
                    }
                }
            }
            catch
            {
                Debug.WriteLine("Error: Insufficient number of elements in the array. character");
            }

#endif
            try
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, "leveldata.txt");

                using (TextReader tr = new StreamReader(filePath))
                {
                    string input;
                    while ((input = tr.ReadLine()) != null)
                    {
                        if (!string.IsNullOrWhiteSpace(input) && !input.StartsWith("//"))
                        {
                            string[] txt = input.Split('\t');
                            Caracter.explist.Add(txt[1]);
                        }
                    }
                }
            }
            catch
            {
                Debug.WriteLine("Error: Insufficient number of elements in the array. Leveldata");
            }


            await SaveDataAsync("itemsidlist.json", Items_Info.itemsidlist);
            await SaveDataAsync("itemstypelist.json", Items_Info.itemstypelist);
            await SaveDataAsync("itemsnamelist.json", Items_Info.itemsnamelist);
            await SaveDataAsync("itemslevellist.json", Items_Info.itemslevellist);
            await SaveDataAsync("items_iconlist.json", Items_Info.items_iconlist);
            await SaveDataAsync("items_maxlist.json", Items_Info.items_maxlist);
            await SaveDataAsync("itemsdurabilitylist.json", Items_Info.itemsdurabilitylist);
            await SaveDataAsync("NPCID.json", Spawns.NPCID);
            await SaveDataAsync("NPCType.json", Spawns.NPCType);

            // Guardar listas de mobs
            await SaveDataAsync("mobsidlist.json", Mobs_Info.mobsidlist);
            await SaveDataAsync("mobstypelist.json", Mobs_Info.mobstypelist);
            await SaveDataAsync("mobsnamelist.json", Mobs_Info.mobsnamelist);
            await SaveDataAsync("mobshplist.json", Mobs_Info.mobshplist);
            await SaveDataAsync("mobslevellist.json", Mobs_Info.mobslevellist);

            // Guardar listas de Monster
            await SaveDataAsync("MonsterModTypeList.json", Monster.ModTypeList);
            await SaveDataAsync("MonsterModNameList.json", Monster.ModNameList);

            // Guardar lista de experiencia
            await SaveDataAsync("Caracterexplist.json", Caracter.explist);

            // Guardar lista de experiencia
            await SaveDictionaryAsync("itemdatatext.json", Data.Itemdatatext);
            Console.WriteLine("cargados los datos a Json");
        }
        private static async Task SaveDictionaryAsync(string fileName, Dictionary<string, ItemData> dictionary)
        {
            var jsonFormatting = Newtonsoft.Json.Formatting.Indented;
            string filePath = Path.Combine(FileSystem.AppDataDirectory, fileName);
            string json = JsonConvert.SerializeObject(dictionary, jsonFormatting);
            using (StreamWriter writer = new StreamWriter(filePath, false))
            {
                await writer.WriteAsync(json);
            }
        }
        private static async Task<Dictionary<string, ItemData>> LoadDictionaryAsync(string fileName)
        {
            string filePath = Path.Combine(FileSystem.AppDataDirectory, fileName);

            if (File.Exists(filePath))
            {
                using (StreamReader reader = new StreamReader(filePath))
                {
                    string json = await reader.ReadToEndAsync();
                    return JsonConvert.DeserializeObject<Dictionary<string, ItemData>>(json);
                }
            }

            return new Dictionary<string, ItemData>(); // Retorna un diccionario vacío si el archivo no existe
        }

        private static void CrearItemData(string[] txt)
        {
            try
            {
                ItemData newItem = new ItemData
                {
                    ID = txt[1],
                    CodeName128 = txt[2],
                    CashItem = txt[7],
                    Country = txt[14],
                    Rarity = txt[15],
                    CanSell = txt[17],
                    ReqLevel1 = txt[33],
                    AssocFileIcon128 = txt[54],
                    MaxStack = txt[57],
                    ReqGender = txt[58],
                    Dur_L = txt[63],
                    Dur_U = txt[64],
                    PD_L = txt[65],
                    PD_U = txt[66],
                    PDInc = txt[67],
                    ER_L = txt[68],
                    ER_U = txt[69],
                    ERInc = txt[70],
                    PAR_L = txt[71],
                    PAR_U = txt[72],
                    PARInc = txt[73],
                    BR_L = txt[74],
                    BR_U = txt[75],
                    MD_L = txt[76],
                    MD_U = txt[77],
                    MDInc = txt[78],
                    MAR_L = txt[79],
                    MAR_U = txt[80],
                    MARInc = txt[81],
                    PDStr_L = txt[82],
                    PDStr_U = txt[83],
                    MDInt_L = txt[84],
                    MDInt_U = txt[85],
                    Range = txt[94],
                    PAttackMin_L = txt[95],
                    PAttackMin_U = txt[96],
                    PAttackMax_L = txt[97],
                    PAttackMax_U = txt[98],
                    PAttackInc = txt[99],
                    MAttackMin_L = txt[100],
                    MAttackMin_U = txt[101],
                    MAttackMax_L = txt[102],
                    MAttackMax_U = txt[103],
                    MAttackInc = txt[104],
                    PAStrMin_L = txt[105],
                    PAStrMin_U = txt[106],
                    PAStrMax_L = txt[107],
                    PAStrMax_U = txt[108],
                    MAInt_Min_L = txt[109],
                    MAInt_Min_U = txt[110],
                    MAInt_Max_L = txt[111],
                    MAInt_Max_U = txt[112],
                    HR_L = txt[113],
                    HR_U = txt[114],
                    HRInc = txt[115],
                    CHR_L = txt[116],
                    CHR_U = txt[117],
                    MaxMagicOptCount = txt[158]

                };
                if (!Data.Itemdatatext.ContainsKey(txt[1]))
                {
                    Data.Itemdatatext.Add(txt[1], newItem);
                }
                else
                {
#if DEBUG
                    Debug.WriteLine($"El ítem con código {txt[1]} ya existe en el diccionario.");
#endif
                }
            }
            catch (Exception ex)
            {
#if DEBUG
                Debug.WriteLine($"Error al crear el ítem: {ex.Message}");
#endif
            }
        }   
        private static string FindRealName(string referenceName)
        {
            int index = Item_RealName.referenceNames1.IndexOf(referenceName);
            if (index >= 0 && index < Item_RealName.realNames1.Count)
            {
                return Item_RealName.realNames1[index];
            }

            index = Item_RealName.referenceNames2.IndexOf(referenceName);
            if (index >= 0 && index < Item_RealName.realNames2.Count)
            {
                return Item_RealName.realNames2[index];
            }

            return "desconocido";
        }
        private static void CategorizeItem(AdvanceItem item, string type)
        {
            if (type.StartsWith("ITEM_ETC_GOLD"))
                AdvanceItem.Gold.Add(item);
            else if (IsWeaponType(type))
                AdvanceItem.Weapon.Add(item);
            else if (IsArmorType(type))
                AdvanceItem.Armor.Add(item);
            else if (IsAccessoriseType(type))
                AdvanceItem.Accessorise.Add(item);
            else if (IsElixirType(type))
                AdvanceItem.Elixir.Add(item);
            else if (IsTabletType(type))
                AdvanceItem.Tablet.Add(item);
            else if (IsMaterialType(type))
                AdvanceItem.Material.Add(item);
            else if (IsPotionType(type))
                AdvanceItem.Potion.Add(item);
            else if (IsReturnType(type))
                AdvanceItem.Return.Add(item);
            else if (IsQuestType(type))
                AdvanceItem.Quest.Add(item);
            else if (IsArrowType(type))
                AdvanceItem.Arrow.Add(item);
            else if (IsMallType(type))
                AdvanceItem.Mall.Add(item);
        }


        private static async Task LoadReferenceDataAsync(string fileName, List<string> referenceNames, List<string> realNames)
        {
            try
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, fileName);

                using (TextReader tr = new StreamReader(filePath))
                {
                    string input;
                    while ((input = await tr.ReadLineAsync()) != null)
                    {
                        // Evitar líneas vacías o compuestas solo por espacios en blanco
                        if (!string.IsNullOrWhiteSpace(input) &&
                            !input.Contains("//") &&
                            !input.Contains("TT_DESC"))
                        {
                            string[] txt = input.Split('\t');

                            // Verificar si el primer dato comienza con "SN_" pero no con "UIIT"
                            if (txt.Length > 1 && txt[1].StartsWith("SN_") && !txt[1].StartsWith("UIIT"))
                            {
                                if (txt.Length > 9)
                                {
                                    referenceNames.Add(txt[1]);
                                    realNames.Add(txt[9]);
                                    Console.WriteLine($"Nombre real: {txt[9]}, Referencia: {txt[1]}");
                                }
                                else
                                {
                                    Debug.WriteLine($"Error en el formato de la línea en {fileName}: {input}");
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error al cargar los datos de referencia desde {fileName}: {ex.Message}");
            }
        }


        // Métodos auxiliares para mejorar la legibilidad
        private static bool IsWeaponType(string type) => type.StartsWith("ITEM_CH_SWORD") || type.StartsWith("ITEM_EU_SWORD") || type.StartsWith("ITEM_CH_BLADE"); /* Otros tipos de armas */
        private static bool IsArmorType(string type) => type.StartsWith("ITEM_CH_M_HEAVY") || type.StartsWith("ITEM_EU_M_HEAVY");/* Otros tipos de armaduras */
        private static bool IsAccessoriseType(string type) => type.StartsWith("ITEM_EU_RING"); /* Otros tipos de accesorios */
        private static bool IsElixirType(string type) => type.StartsWith("ITEM_ETC_ARCHEMY_REINFORCE_RECIPE_WEAPON"); /* Otros tipos de elixires */
        private static bool IsTabletType(string type) => type.Contains("MAGICSTONE"); /* Otros tipos de tabletas */
        private static bool IsMaterialType(string type) => type.StartsWith("ITEM_ETC_ARCHEMY_MATERIAL");
        private static bool IsPotionType(string type) => type.StartsWith("ITEM_ETC_CURE_ALL"); /* Otros tipos de pociones */
        private static bool IsReturnType(string type) => type.StartsWith("ITEM_ETC_SCROLL_RETURN");
        private static bool IsQuestType(string type) => type.Contains("ITEM_QSP") || type.Contains("ITEM_QNO");
        private static bool IsArrowType(string type) => type.StartsWith("ITEM_ETC_AMMO_ARROW") || type.StartsWith("ITEM_ETC_AMMO_BOLT");
        private static bool IsMallType(string type) => type.Contains("ITEM_MALL") || type.Contains("ITEM_EVENT_CH") || type.Contains("ITEM_EVENT_EU");


        //Load NPC End
        public static async void CheckScripts()
        {
            byte error = 0;
            if (!File.Exists(Environment.CurrentDirectory + @"\Data\Scripts\ch_town.txt"))
            {
                error++;
            }
            if (!File.Exists(Environment.CurrentDirectory + @"\Data\Scripts\wc_town.txt"))
            {
                error++;
            }
            if (!File.Exists(Environment.CurrentDirectory + @"\Data\Scripts\kt_town.txt"))
            {
                error++;
            }
            if (!File.Exists(Environment.CurrentDirectory + @"\Data\Scripts\ca_town.txt"))
            {
                error++;
            }
            if (!File.Exists(Environment.CurrentDirectory + @"\Data\Scripts\eu_town.txt"))
            {
                error++;
            }
            if (error > 0)
            {
                await ShowToast("Cannot Load Scripts!");
            }
        }
        private static async Task SaveDataAsync<T>(string fileName, T data)
        {
            try
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, fileName);
                string json = JsonConvert.SerializeObject(data); // Usa JsonConvert.SerializeObject
                await File.WriteAllTextAsync(filePath, json);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error saving data to {fileName}: {ex.Message}");
            }
        }

        private static async Task<T?> LoadDataAsync<T>(string fileName)
        {
            try
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, fileName);
                if (File.Exists(filePath))
                {
                    string json = await File.ReadAllTextAsync(filePath);
                    return JsonConvert.DeserializeObject<T>(json);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error loading data from {fileName}: {ex.Message}");
            }
            return default;
        }










    }






}

