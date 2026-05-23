using bot.Clases;
using bot.SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.viewmodel
{
    public class StallViewModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        private bool _isStallActive;
        private bool _isStallModify;
        private bool _isOpenModify;
        private string _buttonText;
        private string? _buttonModifyText;
        private string _title;
        private string _stallGreeting;

        public Command StallCommand { get; }
        public Command ModifyStallCommand { get; }

        public StallViewModel()
        {
            _isStallActive = false;
            _isStallModify = false;
            _isOpenModify = false;
            _buttonText = "Create Stall";

            _title = $"[{App.MainViewModel?.PlayerName}]'s stall.";
            _stallGreeting = $"Welcome to [{App.MainViewModel?.PlayerName}]'s stall.";

            StallCommand = new Command(ExecuteStallCommand);
            ModifyStallCommand = new Command(ExecuteStallModifyCommand);
        }

        public string ButtonText
        {
            get => _buttonText;
            private set
            {
                _buttonText = value;
                OnPropertyChanged(nameof(ButtonText));
            }
        }

        public string? ButtonModifyText
        {
            get => _buttonModifyText;
            private set
            {
                _buttonModifyText = value;
                OnPropertyChanged(nameof(ButtonModifyText));
            }
        }

        public string Title
        {
            get => _title;
            set
            {
                if (_title != value)
                {
                    _title = value;
                    OnPropertyChanged(nameof(Title));
                }
            }
        }

        public string StallGreeting
        {
            get => _stallGreeting;
            set
            {
                if (_stallGreeting != value)
                {
                    _stallGreeting = value;
                    OnPropertyChanged(nameof(StallGreeting));
                }
            }
        }

        public bool IsStallModify
        {
            get => _isStallModify;
            set
            {
                if (_isStallModify != value)
                {
                    _isStallModify = value;
                    OnPropertyChanged(nameof(IsStallModify));
                }
            }
        }

        private void ExecuteStallCommand()
        {
            if (_isStallActive)
            {
                CloseStall();
            }
            else
            {
                CreateStall();
            }
            Console.WriteLine(_isStallModify);
            Console.WriteLine(_isOpenModify);
        }

        private void ExecuteStallModifyCommand()
        {
            if (_isOpenModify)
            {
                ModifyStall();

            }
            else
            {
                OpenStall();
            }
            Console.WriteLine(_isOpenModify);
        }

        private void CreateStall()
        {
            Packet stall1 = new Packet(0x70B1, true);
            stall1.WriteAscii(Title); // Stall name
            Agent.Send(stall1);

            Packet stall2 = new Packet(0x70BA, true);
            stall2.WriteUInt8(0x06); // Static
            stall2.WriteAscii(StallGreeting); // Welcome message
            Agent.Send(stall2);

            ButtonText = "Close Stall";
            _isStallActive = true;
            IsStallModify = true;
            ButtonModifyText = "Open Stall";
            Console.WriteLine("Create Stall");
        }

        private void OpenStall()
        {
            Packet stallOpen = new Packet(0x70BA);
            stallOpen.WriteUInt8(0x05);
            stallOpen.WriteUInt8(1);
            stallOpen.WriteUInt16(0);
            Agent.Send(stallOpen);

            _isOpenModify = true;
            ButtonModifyText = "Modify Stall";

            Console.WriteLine("Open Stall");
        }

        private void ModifyStall()
        {
            Packet stallOpen = new Packet(0x70BA);
            stallOpen.WriteUInt8(0x05);
            stallOpen.WriteUInt8(0);
            stallOpen.WriteUInt16(0);
            Agent.Send(stallOpen);

            _isOpenModify = false;
            ButtonModifyText = "Open Stall";

            Console.WriteLine("Modify Stall");
        }

        private void CloseStall()
        {
            Packet stallClose = new Packet(0x70B2);
            Agent.Send(stallClose);

            _isStallActive = false;
            ButtonText = "Create Stall";
            IsStallModify = false;
            ButtonModifyText = "";
            Console.WriteLine("Close Stall");
        }

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}

