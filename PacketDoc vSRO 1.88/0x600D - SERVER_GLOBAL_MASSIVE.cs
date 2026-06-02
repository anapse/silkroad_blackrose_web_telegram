        //Command: 0x600D
        //Name: GLOBAL_SERVER_MASSIVE
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_GLOBAL_MASSIVE = 0x600D;
        //  1   byte    Flag [0x00 = Data, 0x01 = Header]
        //  if(Flag == 0x01)
        //  {
        //      2   ushort  Count
        //      2   ushort  CommandID
        //  }
        //  else if(Flag == 0x00)
        //  {
        //      *   byte[]  Data
        //  }