using bot.views;

namespace bot
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();

            BindingContext = App.MainViewModel;

        }
    }
}
