using Android.App;
using Android.Runtime;
[assembly: UsesPermission(Android.Manifest.Permission.ReadExternalStorage, MaxSdkVersion = 32)]

namespace bot.Platforms.Android
{
    [Application]
    public class MainApplication(nint handle, JniHandleOwnership ownership) : MauiApplication(handle, ownership)
    {
        protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
    }
}
