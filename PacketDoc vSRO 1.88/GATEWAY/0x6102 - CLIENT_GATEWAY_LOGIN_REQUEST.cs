        //Opcode: 0x6102
        //Name: CLIENT_GATEWAY_LOGIN_REQUEST
        //Description:
        //Encryption: true
        //Massive: false
        public const ushort CLIENT_GATEWAY_LOGIN_REQUEST = 0x6102;
        //  1   byte    Locale
        //  2   ushort  Username.Length
        //  *   string  Username
        //  2   ushort  Password.Length
        //  *   string  Password
        //  2   ushort  Shard.ID