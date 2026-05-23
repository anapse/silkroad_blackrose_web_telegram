using bot.Clases;
using bot.viewmodel;
using bot.views;

namespace bot
{
    public partial class App : Application
    {

        public static BotConfigViewModel? BotConfigViewModel { get; private set; }
        public static PlayerViewModel? GlobalPlayerViewModel { get; private set; }
        public static ChatService? ChatService { get; private set; }
        public static MainViewModel? MainViewModel { get; private set; }

        public App()
        {
            InitializeComponent();
            BotConfigViewModel = new BotConfigViewModel();
            ChatService = new ChatService();
            MainViewModel = new MainViewModel();
            GlobalPlayerViewModel = new PlayerViewModel();


          
            UserAppTheme = AppTheme.Dark;
         
     
   
   }
        protected override Window CreateWindow(IActivationState? activationState)
        {
            var window = new Window(new AppShell());
            return window;
        }

    }
}
