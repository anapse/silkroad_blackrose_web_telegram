        //Opcode: 0xA102
        //Name: SERVER_GATEWAY_LOGIN_RESPONSE
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_GATEWAY_LOGIN_RESPONSE = 0xA102;
        //  1   byte    result
        //  if(result == 0x01)
        //  {
        //      4   uint    Token
        //      2   ushort  AgentServer.IP.Length
        //      *   string  AgentServer.IP
        //      2   ushort  AgentServer.Port
        //  }
        //  if(result == 0x02)
        //  {
        //      1   byte    errorCode*
        //      if(errorCode == 0x01)
        //      {
        //          4   uint    MaxAttempts
        //          4   uint    Attempts
        //      }
        //      else if(errorCode == 0x02)
        //      {
        //          1   byte    type** [1 = block login, 2 = block login for inspection, 3 = block p2p trade, 4 = block chat]
        //          if(type == 0x01)
        //          {
        //              2   ushort  Reason.Length
        //              *   string  Reason
        //              2   ushort  Year
        //              2   ushort  Month
        //              2   ushort  Day
        //              2   ushort  Hour
        //              2   ushort  Minute
        //              2   ushort  Second
        //              2   ushort  Microsecond
        //          }
        //      }
        //  }
        //  if(result == 0x03) //Custom Message as A102 result, not supported by every client.
        //  {
        //      1   byte    unk1
        //      1   byte    unk2
        //      2   ushort  Message.Length
        //      *   string  Message
        //      2   ushort  unk3
        //  }
        //  *errorCodes:
        //      01 - "Password entry has failed %d out of %d times."
        //      02 - -> Blocked
        //      03 - "This user is already connected. The user may still be connected because of an error that forced the game to close. Please try again in 5 minutes."
        //      04 - "Faild to Connect to Server (C5)."
        //      05 - "The server is full, please try again later."
        //      06 - "Faild to Connect to Server (C7)."
        //      07 - "Faild to Connect to Server (C8)."
        //      08 - "Faild to connect to server because access to the current IP has exceeded its limit."
        //      09 - "0"
        //      10 - "Only adults over the age of 18 are allowed to connect to server."
        //      11 - "Only users over the age of 12 are allowed to connect to the server."
        //      12 - "Adults over the age of 18 are not allowed to connect to the Teen server." 
        //  **types:
        //      01 - 0\nBlocking reason:{0}\nCompletion time:{0}
        //      02 - Cannot connect to the server because the server is now in inspection.
        //      03 - ID is found, but the needed details are not found.\nFill in the needed information at Silkroad homepage to connect to the game. *Msg Box -> Client Close -> Website opens
        //      04 - Cannot connect because the free service is over.