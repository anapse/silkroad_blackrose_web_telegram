using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.model
{
    public class ChatMessageItem : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        private string? chatFrom;
        private string? separador;
        private string? chatMessage;


        private MessageType messageType;

        public MessageType MessageType
        {
            get => messageType;
            set
            {
                messageType = value;
                OnPropertyChanged(nameof(MessageType));
            }
        }
        public string? ChatFrom
        {
            get => chatFrom;
            set
            {
                chatFrom = value;
                OnPropertyChanged(nameof(ChatFrom));
            }
        }

        public string? Separador
        {
            get => separador;
            set
            {
                separador = value;
                OnPropertyChanged(nameof(Separador));
            }
        }

        public string? ChatMessage
        {
            get => chatMessage;
            set
            {
                chatMessage = value;
                OnPropertyChanged(nameof(ChatMessage));
            }
        }

        protected virtual void OnPropertyChanged(string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
    public enum MessageType
    {
        Pm,
        Global,
        All,
        Notice
    }
}