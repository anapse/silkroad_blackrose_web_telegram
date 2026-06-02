        //Opcode: 0xA323
        //Name: SERVER_GATEWAY_LOGIN_IBUV_RESULT
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_GATEWAY_LOGIN_IBUV_RESULT = 0xA323;
        //  1   byte    result [0x01 = Sucess, 0x02 = Error]
        //  if(result = 0x02)
        //  {
        //      4   uint    MaxAttempts
        //      4   uint    Attempts
        //  }
        //  *ErrorCodes:
        //      02 - "Image code entry has failed %d out of %d times."