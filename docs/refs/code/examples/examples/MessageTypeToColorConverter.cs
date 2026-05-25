using bot.model;
using System.Globalization;
using Microsoft.Maui.Graphics;





namespace bot.views
{
    public class MessageTypeToColorConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            switch ((MessageType?)value)
            {
                case MessageType.Pm:
                    return Colors.MediumBlue;
                case MessageType.Global:
                    return Colors.Yellow;
                case MessageType.Notice:
                    return Colors.HotPink;
                case MessageType.All:
                    return Colors.White;
                default:
                    return Colors.Black;
            }
        }

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}