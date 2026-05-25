using bot.Clases;
using bot.Clases.Controles;
using bot.Clases.infoclass;
using SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace bot.viewmodel
{
    public class BotConfigViewModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;
        private double _sliderValue = 10;

        public double SliderValue
        {
            get { return _sliderValue; }
            set
            {
                if (_sliderValue != value)
                {
                    _sliderValue = value;
                    OnPropertyChanged(nameof(SliderValue));
                    OnPropertyChanged(nameof(SliderValueString));
                }
            }
        }

        public string SliderValueString
        {
            get { return _sliderValue.ToString("0"); }
        }


        public ICommand ComandoSetcoord { get; }
        public ICommand ComandoIniciarBot { get; }
        public ICommand ComandoApagarBot { get; }
        public BotConfigViewModel()
        {
            ComandoSetcoord = new Command(Setcoord);
            ComandoIniciarBot = new Command(IniciarBot);
            ComandoApagarBot = new Command(ApagarBot);
        }

        private string? x_cord;
        public string? X_cord
        {
            get { return x_cord; }
            set
            {
                x_cord = value;
                OnPropertyChanged(nameof(X_cord));
            }
        }
        private string? y_cord;
        public string? Y_cord
        {
            get { return y_cord; }
            set
            {
                y_cord = value;
                OnPropertyChanged(nameof(Y_cord));
            }
        }
        private string _botonconectado = "Inciar Bot";
        public string Botonconectado
        {
            get => _botonconectado;
            set
            {
                _botonconectado = value;

            }
        }

        private Color _colorconectar = Colors.Blue;
        public Color Colorconectar
        {
            get => _colorconectar;
            set
            {
                _colorconectar = value;
                OnPropertyChanged(nameof(Colorconectar));
            }
        }
        private string _botonconectado2 = "Apagar Bot";
        public string Botonconectado2
        {
            get => _botonconectado2;
            set
            {
                _botonconectado2 = value;
                OnPropertyChanged(nameof(Botonconectado2));
            }
        }

        private Color _colorconectar2 = Colors.Blue;
        public Color Colorconectar2
        {
            get => _colorconectar2;
            set
            {
                _colorconectar2 = value;
                OnPropertyChanged(nameof(Colorconectar2));
            }
        }
        public void Setcoord()
        {
            X_cord = Caracter.X.ToString();
            Y_cord = Caracter.Y.ToString();
        }
        private void IniciarBot()
        {/*
            Packet NewPacket = new Packet(0x3026);
            NewPacket.WriteUInt8(7);
            string name = "You just started the bot for " + Caracter.PlayerName + "! Enjoy botting!";
            NewPacket.WriteUInt16(name.Length);
            NewPacket.WriteUInt8Array(Globals.StringToByteArray(Globals.StringToHex(name)));
            Agent.Send(NewPacket);*/
            Data.bot = true;
            StartLooping.CheckStart();

        }
        private void ApagarBot()
        {
        }
        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
