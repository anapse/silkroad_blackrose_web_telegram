        //Opcode: 0x6103
        //Name: CLIENT_AGENT_LOGIN_REQUEST
        //Description:
        //Encryption: true
        //Massive: false
        public const ushort CLIENT_AGENT_LOGIN_REQUEST = 0x6103;
        //  4   uint    Token
        //  2   ushort  Username.Length
        //  *   string  Username
        //  2   ushort  Password.Length
        //  *   string  Password
        //  1   byte    Locale
        //  6   byte[]  MAC-Address