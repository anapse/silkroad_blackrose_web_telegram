namespace bot.Clases
{
    using SilkroadSecurityApi;
    using System;
    using System.Drawing;
    using System.IO;
    using System.Runtime.InteropServices;

    internal class Captcha
    {
        [DllImport("ZlibDll.dll", CallingConvention = CallingConvention.Cdecl)]
        public static extern int Compress(byte[] decompressed_buffer, int decompressed_size, byte[] compressed_buffer, ref int compressed_size);
        [DllImport("ZlibDll.dll", CallingConvention = CallingConvention.Cdecl)]
        public static extern int Decompress(byte[] compressed_buffer, int compressed_size, byte[] decompressed_buffer, ref int decompressed_size);
        public static uint[] GeneratePacketCaptcha(Packet packet)
        {
            byte num = packet.ReadUInt8();
            ushort num2 = packet.ReadUInt16();
            ushort count = packet.ReadUInt16();
            ushort num4 = packet.ReadUInt16();
            ushort num5 = packet.ReadUInt16();
            ushort num6 = packet.ReadUInt16();
            if ((num5 != 200) || (num6 != 0x40))
            {
                throw new NotImplementedException("The captcha is expected to be 200 x 64 pixels.");
            }
            byte[] buffer = packet.ReadUInt8Array(count);
            if (packet.RemainingRead() != 0)
            {
                throw new Exception("Unknown captcha packet.");
            }
            int num7 = num4;
            byte[]? buffer2 = new byte[num4];
            int num8 = Decompress(buffer, count, buffer2, ref num7);
            if (num8 != 0)
            {
                throw new Exception("Decompress returned error code " + num8);
            }
            byte[] dst = new byte[num7];
            Buffer.BlockCopy(buffer2, 0, dst, 0, num7);
            buffer2 = null;
            uint[] numArray = new uint[num5 * num6];
            int num9 = 0;
            for (int i = 0; i < num6; i++)
            {
                for (int j = 0; j < num5; j++)
                {
                    uint index = (uint)((i * num5) + j);
                    numArray[index] = (uint)(((byte)Math.Pow(2.0, (double)(num9++ % 8))) & dst[(int)((IntPtr)(index / 8))]);
                    if (numArray[index] == 0)
                    {
                        numArray[index] = 0xff000000;
                    }
                    else
                    {
                        numArray[index] = uint.MaxValue;
                    }
                }
            }
            return numArray;
        }

        public static void SaveCaptchaToBMP(uint[] pixels, string filename)
        {
            byte[] buffer = new byte[] {
                0x42, 0x4d, 0x7a, 200, 0, 0, 0, 0, 0, 0, 0x7a, 0, 0, 0, 0x6c, 0,
                0, 0, 200, 0, 0, 0, 0x40, 0, 0, 0, 1, 0, 0x20, 0, 3, 0,
                0, 0, 0, 200, 0, 0, 0x12, 11, 0, 0, 0x12, 11, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0, 0, 0xff, 0, 0, 0xff, 0,
                0, 0, 0, 0, 0, 0xff, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0
             };
            using (FileStream stream = new FileStream(filename, FileMode.Create, FileAccess.Write))
            {
                using (BinaryWriter writer = new BinaryWriter(stream))
                {
                    writer.Write(buffer);
                    for (int i = 0x3f; i >= 0; i--)
                    {
                        for (int j = 0; j < 200; j++)
                        {
                            writer.Write(pixels[(i * 200) + j]);
                        }
                    }
                    writer.Flush();
                }
            }

        }

        public static void SendCaptcha(string msg)
        {
            Packet packet = new Packet(0x6323);
            packet.WriteAscii(msg);
            Gateway.SendToServer(packet);
        }
    }
}

