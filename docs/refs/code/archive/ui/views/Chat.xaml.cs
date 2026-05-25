using bot.model;
using bot.viewmodel;
using Microsoft.Maui.Controls;
namespace bot.views;

public partial class Chat : ContentPage
{

    public Chat()
    {
        InitializeComponent();
        BindingContext = new ChatViewModel();
    }
    private void OnMenuClicked(object sender, EventArgs e)
    {



    }

    private void OnMessageTapped(object sender, EventArgs e)
    {
        if (sender is VisualElement element && element.BindingContext is ChatMessageItem message)
        {
            // Aquí puedes acceder a la propiedad Playerchat del mensaje
            ((ChatViewModel)BindingContext).Playerchat = message.ChatFrom;
            Console.WriteLine(message.ChatFrom);
        }
    }
}