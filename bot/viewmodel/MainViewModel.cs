using bot.Clases;
using bot.model;
using bot.SilkroadSecurityApi;
using bot.views;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;

using System.Windows.Input;




namespace bot.viewmodel
{
    public class MainViewModel : INotifyPropertyChanged
    {
        public Command NavigateToChatCommand { get; }
        public ICommand ComandoStartgateway { get; }
        public ICommand? ComandoConectarplayer { get; }
        public Command DCplayer { get; }
        public ICommand LoadDataCommand { get; }
        private Command? _combineFilesCommand;
        public Command CombineFilesCommand => _combineFilesCommand ??= new Command(async () => await CombineFiles());
        public Command? SelectCharacterCommand { get; }
        private ObservableCollection<string> _characters = new ObservableCollection<string>();
        private string? _selectedCharacterName;
        private Color _colorconectarplayer = (Color)Application.Current!.Resources["ColorBorderBoton"]!;
        private string? _serverResponseMessage;
        private Color _colorconectar = (Color)Application.Current.Resources["ColorBorderBoton"];
        private Color colorLoad = (Color)Application.Current.Resources["ColorBorderBoton"];
        private string textLoad = "Cargar Datos";
        public string? _playerName;
        public event PropertyChangedEventHandler? PropertyChanged;
        private bool isRunning;
        private string _botonconectado2 = "Escoje Player";
        private string _ipserver = "195.179.229.135";
        private uint _localeid = 22; // Valor por defecto
        private string _localeidText = "22"; // Valor por defe
        public string _version = "271";
        private string _puerto = "15790";
        private string _username = "anapse";
        private string _password = "123456";
        private string _captcha = "1";
        private string _botonconectado = "Conectar Servidor";
        public MainViewModel()
        {
            DCplayer = new Command(MainViewModel.Disconect);
            LoadDataCommand = new Command(async () => await LoadData());
            SelectCharacterCommand = new Command(SelectCharacter);
            NavigateToChatCommand = new Command(async () => await NavigateToChat());
            ComandoStartgateway = new Command(ExecuteStartgatewayAsync);

        }

        public ObservableCollection<string> Characters
        {
            get => _characters;
            set
            {
                _characters = value;
                OnPropertyChanged(nameof(Characters));
            }
        }
        public string? SelectedCharacterName
        {
            get => _selectedCharacterName;
            set
            {
                if (_selectedCharacterName != value)
                {
                    _selectedCharacterName = value;
                    OnPropertyChanged(nameof(SelectedCharacterName));
                    SelectCharacterCommand?.ChangeCanExecute();
                }
            }
        }
        public string? ServerResponseMessage
        {
            get => _serverResponseMessage;
            set
            {
                _serverResponseMessage = value;
                OnPropertyChanged(nameof(ServerResponseMessage));
            }
        }
        public string? PlayerName
        {
            get => _playerName;
            set
            {
                _playerName = value;
                OnPropertyChanged(nameof(PlayerName));
            }
        }
        public string Ipserver
        {
            get => _ipserver;
            set
            {
                _ipserver = value;
                OnPropertyChanged(nameof(Ipserver));
            }
        }
        public uint Localeid
        {
            get => _localeid;
            set
            {
                if (_localeid != value)
                {
                    _localeid = value;
                    OnPropertyChanged(nameof(Localeid));
                }
            }
        }
        public string LocaleidText
        {
            get => _localeidText;
            set
            {
                if (_localeidText != value)
                {
                    _localeidText = value;

                    // Intenta convertir el texto a uint
                    if (uint.TryParse(value, out uint result))
                    {
                        Localeid = result; // Asigna el valor a la propiedad uint
                    }
                    else
                    {
                        // Maneja el error si la conversión falla, por ejemplo, estableciendo un valor predeterminado
                        Localeid = 0;
                    }

                    OnPropertyChanged(nameof(LocaleidText));
                }
            }
        }
        public string Version
        {
            get => _version;
            set
            {
                _version = value;
                OnPropertyChanged(nameof(Version));
            }
        }
        public string Puerto
        {
            get => _puerto;
            set
            {
                _puerto = value;
                OnPropertyChanged(nameof(Puerto));
            }
        }
        public string Username
        {
            get => _username;
            set
            {
                _username = value;
                OnPropertyChanged(nameof(Username));
            }
        }
        public string Password
        {
            get => _password;
            set
            {
                _password = value;
                OnPropertyChanged(nameof(Password));
            }
        }
        public string Captcha
        {
            get => _captcha;
            set
            {
                _captcha = value;
                OnPropertyChanged(nameof(Captcha));
            }
        }
        public string Botonconectado
        {
            get => _botonconectado;
            set
            {
                _botonconectado = value;
                OnPropertyChanged(nameof(Botonconectado));
            }
        }
        public string Botonconectado2
        {
            get => _botonconectado2;
            set
            {
                _botonconectado2 = value;
                OnPropertyChanged(nameof(Botonconectado2));
            }
        }
        public string TextLoad
        {
            get => textLoad;
            set
            {
                if (textLoad != value)
                {
                    textLoad = value;
                    OnPropertyChanged(nameof(TextLoad));
                }
            }
        }
        public Color ColorLoad
        {
            get => colorLoad;
            set
            {
                if (colorLoad != value)
                {
                    colorLoad = value;
                    OnPropertyChanged(nameof(ColorLoad));
                }
            }
        }
        public Color Colorconectar
        {
            get => _colorconectar;
            set
            {
                if (_colorconectar != value)
                {
                    _colorconectar = value;
                    OnPropertyChanged(nameof(Colorconectar));
                }
            }
        }
        public Color Colorconectarplayer
        {
            get => _colorconectarplayer;
            set
            {
                if (_colorconectarplayer != value)
                {
                    _colorconectarplayer = value;
                    OnPropertyChanged(nameof(Colorconectarplayer));
                }
            }
        }
        public bool IsRunning
        {
            get { return isRunning; }
            set
            {
                isRunning = value;
                OnPropertyChanged(nameof(IsRunning));
            }
        }

        // metodos



        public void DatosCargados()
        {
            TextLoad = "Datos Cargados";
            ColorLoad = Colors.Green;
        }
        public void UpdateServerResponse(string message)
        {
            ServerResponseMessage = message;
        }
        public void Conectado()
        {
            Botonconectado = "Conectado";
            Colorconectar = Colors.Green;
        }
        public void PlayerConectado()
        {

            Botonconectado2 = "Conectado";
            Colorconectarplayer = Colors.Green;
        }
        public void Conectando()
        {
            Botonconectado = "Conectando...";
            Colorconectar = Colors.Blue;
        }
        public void PlayerConectando()
        {
            Botonconectado2 = "Conectar Player";
            Colorconectarplayer = Colors.Blue;

        }

        private void ExecuteStartgatewayAsync()
        {
            try
            {
                if (Gateway.IsRunning())
                {
                    Gateway.Stop();
                    Thread.Sleep(1000);
                }

                Gateway.Start();

                Botonconectado = "Conectado";
                Colorconectar = Colors.Green;
            }
            catch (Exception ex)
            {
                Botonconectado = "Error al conectar";
                Colorconectar = Colors.Red;
                Debug.WriteLine("Error en la conexión: " + ex.Message);
            }
        }
        public async Task LoadData()
        {
            Cargandodatos();
            await LoadTXT.LoadDataAsync();

        }
        public void Cargandodatos()
        {
            TextLoad = "Cargando Datos";
            ColorLoad = Colors.Orange;
        }
        public static void Disconect()
        {
            Packet DC = new Packet(0x7005);
            DC.WriteUInt8(0x01);
            Agent.Send(DC);
        }
        private void SelectCharacter()
        {

            if (!string.IsNullOrEmpty(SelectedCharacterName))
            {
                Packet NewPacket = new Packet(0x7001);
                NewPacket.WriteAscii(SelectedCharacterName);
                Agent.Send(NewPacket);

            }
            else
            {
                Application.Current?.Dispatcher?.Dispatch(async () => {
                    Page page = Application.Current?.Windows.FirstOrDefault()?.Page
                   ?? new ContentPage();
                    await page.DisplayAlert("Error", "Por favor, selecciona un personaje", "OK");
                });
            }
        }
        private static async Task CombineFiles()
        {
            List<string> filePaths = await FileHelper.PickAndSaveMultipleFilesAsync();
            if (filePaths != null && filePaths.Count > 0)
            {
                string? combinedItemDataPath = await FileHelper.CombineItemDataFilesAsync(filePaths);
                string? combinedCharacterDataPath = await FileHelper.CombineCharacterDataFilesAsync(filePaths);

                string message = "";
                if (!string.IsNullOrEmpty(combinedItemDataPath))
                {
                    message += $"El archivo de datos de items se ha guardado en: {combinedItemDataPath}\n\n";
                }
                if (!string.IsNullOrEmpty(combinedCharacterDataPath))
                {
                    message += $"El archivo de datos de personajes se ha guardado en: {combinedCharacterDataPath}\n\n";
                }

                if (!string.IsNullOrEmpty(message))
                {
                    var page = Application.Current?.Windows.FirstOrDefault()?.Page
                   ?? new ContentPage();
                    await page.DisplayAlert("Archivos Combinados", message.Trim(), "OK");
                }
                else
                {
                    var page = Application.Current?.Windows.FirstOrDefault()?.Page
                 ?? new ContentPage();
                    await page.DisplayAlert("Error", "Hubo un problema al combinar los archivos.", "OK");
                }
            }
            else
            {
                var page = Application.Current?.Windows.FirstOrDefault()?.Page
                ?? new ContentPage();
                await page.DisplayAlert("No se cargaron archivos", "No se seleccionaron archivos o hubo un error al guardar.", "OK");
            }
        }
        public async Task StartLoop()
        {
            IsRunning = true;

            while (IsRunning)
            {
                if (Global.Server != Global.ServerEnum.None)
                {

                    if (Global.Server == Global.ServerEnum.Gateway)
                    {

                        Console.WriteLine("pin gate");
                    }
                    else if (Global.Server == Global.ServerEnum.Agent)
                    {

                        Agent.Pinkserver();
                    }
                }

                await Task.Delay(5000); // Espera 5 segundo antes de la siguiente iteración
            }
        }
        private async Task NavigateToChat()
        {
            await Shell.Current.GoToAsync(nameof(Chat));
        }
        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
