using bot.model;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases
{
    public class ChatService
    {
        public ObservableCollection<ChatMessageItem> Messages { get; } = new ObservableCollection<ChatMessageItem>();

        public void AddMessage(string chatFrom, string separador, string chatMessage, MessageType messageType)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                Messages.Add(new ChatMessageItem { ChatFrom = chatFrom, Separador = separador, ChatMessage = chatMessage, MessageType = messageType });
            });
        }
    }
}
