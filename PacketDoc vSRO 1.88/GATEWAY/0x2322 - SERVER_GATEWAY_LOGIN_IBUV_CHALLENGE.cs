        //Opcode: 0x2322
        //Name: SERVER_GATEWAY_LOGIN_IBUV_CHALLENGE
        //Description: Response to 0x6102 before 0xA102 if IBUV is enabled
        //Encryption: false
        //Massive: false
        public const ushort SERVER_GATEWAY_LOGIN_IBUV_CHALLENGE = 0x2322;
        //  1   byte    Flag
        //  2   ushort  remain
        //  2   ushort  compressed
        //  2   ushort  uncompressed
        //  2   ushort  width
        //  2   ushort  height
        //  *   byte[]  compressedData