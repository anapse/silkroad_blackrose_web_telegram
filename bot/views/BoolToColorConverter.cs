using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.views
{
    public class BoolToColorConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is bool boolValue)
            {
                return (bool)value ? (Color)Application.Current.Resources["ColorPestañaActiva"] : (Color)Application.Current.Resources["ColorPestañainActiva"];
            }
            return (Color)Application.Current.Resources["ColorPestañainActiva"];
        }

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}
