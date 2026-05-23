using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using bot.model;
using System.Windows.Input;
using System.Runtime.CompilerServices;
using bot.Clases;

namespace bot.viewmodel
{
    public class ChatViewModel : INotifyPropertyChanged
    {

        private string? playerchat = App.MainViewModel?.PlayerName;
        private string? smschat;

        public ChatViewModel()
        {

            ComandoEnviarpm = new Command(EnviarMensaje);
            bienvenidamsg();
        }

        public ObservableCollection<ChatMessageItem> Messages
        {
            get
            {
                if (App.ChatService == null)
                {
                    throw new InvalidOperationException("ChatService is not initialized.");
                }

                return App.ChatService.Messages;
            }
        }

        public string? Playerchat
        {
            get => playerchat;
            set
            {
                if (playerchat != value)
                {
                    playerchat = value;
                    OnPropertyChanged(nameof(Playerchat));

                }
            }
        }

        public string? Smschat
        {
            get => smschat;
            set
            {
                if (smschat != value)
                {
                    smschat = value;
                    OnPropertyChanged(nameof(Smschat));
                }
            }
        }

        public ICommand ComandoEnviarpm { get; private set; }



        public void bienvenidamsg()
        {

            App.ChatService?.AddMessage("Server Arkansas", "(From): ", "Bienvenido", MessageType.Notice);
        }
        private void EnviarMensaje()
        {

            if (!string.IsNullOrWhiteSpace(Playerchat) && !string.IsNullOrWhiteSpace(Smschat))
            {



                if (Playerchat == App.MainViewModel?.PlayerName)
                {
                    try
                    {
                        App.ChatService?.AddMessage(Playerchat, ":", Smschat, model.MessageType.All);
                        Agent.Mensajes(Playerchat, Smschat, "all");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.ToString());
                    }
                }
                else
                {
                    try
                    {
                        Agent.Mensajes(Playerchat, Smschat, "pm");
                        App.ChatService?.AddMessage(Playerchat, "(TO):", Smschat, model.MessageType.Pm);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.ToString());
                    }
                }


                Smschat = string.Empty; // Limpiar el mensaje después de enviarlo
            }

        }

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public event PropertyChangedEventHandler? PropertyChanged;
    }

}