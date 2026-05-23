namespace bot.views;

public partial class Botconfig : ContentPage
{
    public Botconfig()
    {
        InitializeComponent();
        BindingContext = App.BotConfigViewModel;
    }
}