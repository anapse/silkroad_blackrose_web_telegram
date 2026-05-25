using bot.viewmodel;

namespace bot.views;

public partial class Stall : ContentPage
{
    public Stall()
    {
        InitializeComponent();
        BindingContext = new StallViewModel();
    }

    private void TitleEntry_Unfocused(object sender, FocusEventArgs e)
    {
        var viewModel = BindingContext as StallViewModel;
        if (viewModel != null && string.IsNullOrWhiteSpace(viewModel.Title))
        {
            viewModel.Title = $"[{App.MainViewModel?.PlayerName}]'s stall.";
        }
    }

    private void StallGreetingEntry_Unfocused(object sender, FocusEventArgs e)
    {
        var viewModel = BindingContext as StallViewModel;
        if (viewModel != null && string.IsNullOrWhiteSpace(viewModel.StallGreeting))
        {
            viewModel.StallGreeting = $"Welcome to [{App.MainViewModel?.PlayerName}]'s stall.";
        }
    }
}
