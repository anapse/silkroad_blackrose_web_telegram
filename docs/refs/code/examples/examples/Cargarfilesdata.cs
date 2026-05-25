using CommunityToolkit.Maui.Alerts;
using CommunityToolkit.Maui.Core;
using Microsoft.Maui.Controls.PlatformConfiguration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases
{
    public static class FileHelper
    {

        public static async Task<List<string>> PickAndSaveMultipleFilesAsync()
        {
            DeleteJsonFiles();
            var savedFilePaths = new List<string>();

            try
            {
                var customFileType = new FilePickerFileType(new Dictionary<DevicePlatform, IEnumerable<string>>
        {
            { DevicePlatform.iOS, new[] { "public.text" } },
            { DevicePlatform.Android, new[] { "text/plain" } }
        });

                var result = await FilePicker.PickMultipleAsync(new PickOptions
                {
                    PickerTitle = "Seleccione archivos de configuración",
                    FileTypes = customFileType
                });

                if (result != null && result.Any())
                {
                    foreach (var file in result)
                    {
                        try
                        {
                            string content = await File.ReadAllTextAsync(file.FullPath);
                            string appDataPath = Path.Combine(FileSystem.AppDataDirectory, file.FileName);
                            await File.WriteAllTextAsync(appDataPath, content);
                            savedFilePaths.Add(appDataPath);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error al guardar el archivo {file.FileName}: {ex.Message}");
                            var page = Application.Current?.Windows.FirstOrDefault()?.Page
                                ?? new ContentPage();
                            await page.DisplayAlert("Error", $"No se pudo guardar el archivo {file.FileName}: {ex.Message}", "OK");
                        }
                    }
                }
                else
                {
                    var page = Application.Current?.Windows.FirstOrDefault()?.Page
                               ?? new ContentPage();
                    await page.DisplayAlert("No se seleccionaron archivos", "No se seleccionaron archivos o hubo un error al seleccionar.", "OK");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al seleccionar archivos: {ex.Message}");
                var page = Application.Current?.Windows.FirstOrDefault()?.Page
                                ?? new ContentPage();
                await page.DisplayAlert("Error", $"No se pudo seleccionar archivos: {ex.Message}", "OK");
            }

            return savedFilePaths;
        }

        public static async Task<string?> CombineItemDataFilesAsync(List<string> filePaths)
        {
            try
            {
                var combinedLines = new HashSet<string>();

                foreach (var filePath in filePaths)
                {
                    if (File.Exists(filePath) && Path.GetFileName(filePath).StartsWith("itemdata_"))
                    {
                        var lines = await File.ReadAllLinesAsync(filePath);
                        foreach (var line in lines)
                        {
                            combinedLines.Add(line);
                        }
                    }
                }

                string combinedFileName = "itemdata.txt";
                string combinedFilePath = Path.Combine(FileSystem.AppDataDirectory, combinedFileName);

                await File.WriteAllLinesAsync(combinedFilePath, combinedLines);

                return combinedFilePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al combinar archivos: {ex.Message}");
                var page = Application.Current?.Windows.FirstOrDefault()?.Page
                  ?? new ContentPage();
                await page.DisplayAlert("Error", $"No se pudo combinar los archivos: {ex.Message}", "OK");
                return null;
            }
        }
        public static async Task<string?> CombineCharacterDataFilesAsync(List<string> filePaths, bool showAlerts = true)
        {
            try
            {
                var combinedLines = new HashSet<string>();

                foreach (var filePath in filePaths)
                {
                    if (File.Exists(filePath) && Path.GetFileName(filePath).StartsWith("characterdata_"))
                    {
                        var lines = await File.ReadAllLinesAsync(filePath);
                        foreach (var line in lines)
                        {
                            combinedLines.Add(line);
                        }
                    }
                }

                if (combinedLines.Count == 0)
                {
                    throw new Exception("No se encontraron archivos de datos de personajes válidos.");
                }

                string combinedFileName = "characterdata.txt";
                string combinedFilePath = Path.Combine(FileSystem.AppDataDirectory, combinedFileName);

                await File.WriteAllLinesAsync(combinedFilePath, combinedLines);

                return combinedFilePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al combinar archivos de datos de personajes: {ex.Message}");
                if (showAlerts)
                {
                    var page = Application.Current?.Windows.FirstOrDefault()?.Page
                    ?? new ContentPage();
                    await page.DisplayAlert("Error", $"No se pudo combinar los archivos de datos de personajes: {ex.Message}", "OK");
                }
                return null;
            }
        }

        


        public static void DeleteJsonFiles()
        {
            var filesToDelete = new List<string>
    {
        "itemsidlist.json",
        "itemstypelist.json",
        "itemsnamelist.json",
        "itemslevellist.json",
        "items_iconlist.json",
        "items_maxlist.json",
        "itemsdurabilitylist.json",
        "NPCID.json",
        "NPCType.json",
        "mobsidlist.json",
        "mobstypelist.json",
        "mobsnamelist.json",
        "mobshplist.json",
        "mobslevellist.json",
        "MonsterModTypeList.json",
        "MonsterModNameList.json",
        "Caracterexplist.json",
          "itemdata.txt",
            "characterdata.txt",
            "textdata_object.txt",
            "textdata_equipskill.txt",
            "leveldata.txt"
    };

            foreach (var fileName in filesToDelete)
            {
                string filePath = Path.Combine(FileSystem.AppDataDirectory, fileName);
                if (File.Exists(filePath))
                {
                    try
                    {
                        File.Delete(filePath);
                        Console.WriteLine($"Archivo {fileName} eliminado con éxito.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error al eliminar el archivo {fileName}: {ex.Message}");
                    }
                }
            }
        }

    }
}