using bot.SilkroadSecurityApi;
using SilkroadSecurityApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace bot.Clases
{




    public static class PacketProcessor
    {
        public static void AnalyzePacket(Packet packet)
        {
            packet.Lock();
            byte[] packetData = packet.GetBytes();

            Console.WriteLine($"Opcode: {packet.Opcode}");
            Console.WriteLine($"Tamaño total del paquete: {packetData.Length} bytes");

            Console.WriteLine("\nContenido del paquete (en hexadecimal):");
            for (int i = 0; i < packetData.Length; i++)
            {
                Console.Write($"{packetData[i]:X2} ");
                if ((i + 1) % 16 == 0 || i == packetData.Length - 1)
                {
                    Console.WriteLine();
                }
            }

            Console.WriteLine("\nAnálisis de posibles tipos de datos:");
            using (var reader = new PacketReader(packetData))
            {
                while (reader.BaseStream.Position < reader.BaseStream.Length)
                {
                    long position = reader.BaseStream.Position;
                    try
                    {
                        Console.Write($"Posición {position,4}: ");
                        if (reader.BaseStream.Length - position >= 8)
                        {
                            Console.WriteLine($"UInt64: {reader.ReadUInt64()}");
                        }
                        else if (reader.BaseStream.Length - position >= 4)
                        {
                            Console.WriteLine($"UInt32: {reader.ReadUInt32()}");
                        }
                        else if (reader.BaseStream.Length - position >= 2)
                        {
                            Console.WriteLine($"UInt16: {reader.ReadUInt16()}");
                        }
                        else
                        {
                            Console.WriteLine($"Byte: {reader.ReadByte()}");
                        }
                    }
                    catch
                    {
                        reader.BaseStream.Position = position + 1;
                        Console.WriteLine("No se pudo interpretar");
                    }
                }
            }
        }
    }


}