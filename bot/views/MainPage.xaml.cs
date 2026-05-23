
namespace bot.views
{
    public partial class MainPage : ContentPage
    {

        public MainPage()
        {
            InitializeComponent();
            var viewModel = App.MainViewModel;
            BindingContext = viewModel;
         

        }
        private void OnMenuClicked(object sender, EventArgs e)
        {
            Shell.Current.FlyoutIsPresented = true;
        }

    }

}
