        //Opcode: 0x6100
        //Name: CLIENT_GATEWAY_PATCH_REQUEST
        //Description:
        //Encryption: true
        //Massive: false
        public const ushort CLIENT_GATEWAY_PATCH_REQUEST = 0x6100;
        //  1   byte    Locale
        //  2   ushort  ServiceName.Length
        //  *   string  ServiceName
        //  4   uint    Version