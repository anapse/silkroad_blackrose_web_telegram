using bot.model;
using bot.viewmodel;

namespace bot.views;

public partial class ItemDetallesPopup : CommunityToolkit.Maui.Views.Popup
{
    public ItemDetallesPopup(ItemDetailsPopupViewModel viewModel)
    {
        InitializeComponent();
        // Crear una instancia del ViewModel y establecer el BindingContext
        BindingContext = viewModel;

    }
}