
using System.Globalization;

namespace bot.views;

public partial class Player : ContentPage
{
    public Player()
    {
        InitializeComponent();

        BindingContext = App.GlobalPlayerViewModel;

    }

}