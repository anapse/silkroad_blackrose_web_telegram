        //Command: 0x2001
        //Name: X_GLOBAL_IDENTIFICATION
        //Description:
        //Encryption: true, client only
        //Massive: false
        public const ushort X_GLOBAL_IDENTIFICATION = 0x2001;
        //  2   ushort  ServiceName.Length
        //  *   string  ServiceName
        //  1   byte    Flag [0x00 = Client, 0x01 = Server]