        //Opcode: 0xA103
        //Name: SERVER_AGENT_LOGIN_RESPONSE
        //Description:
        //Encryption: true
        //Massive: false
        public const ushort SERVER_AGENT_LOGIN_RESPONSE = 0xA103;
        //  1   byte    result
        //  if(result == 0x02)
        //  {
        //      1   byte    errorCode*
        //  }
        //  *ErrorCodes:
        //      01 - Faild to connect to server. (C9)
        //      02 - Faild to connect to server (C10)
        //      03 - Faild to connect to server (C10)
        //      04 - ServerIsFull...
        //      05 - Faild to connect to server because access to the current IP has exceeded its limit.
        //      06 - 0