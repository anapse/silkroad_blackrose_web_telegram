        //Opcode: 0xB001
        //Name: SERVER_AGENT_CHARACTER_SELECTION_JOIN_RESPONSE
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_AGENT_CHARACTER_SELECTION_JOIN_RESPONSE = 0xB001;
        //  1   byte    result
        //  if(result == 0x02)
        //  {
        //      2   ushort  errorCode*
        //  }
        //  **ErrorCodes:
        //      1033 - The server is not running.. Please try to connect again later.(S1033) (=> When GameServer with character containing region is down.)
        //      1019 - The server is not running.. Please try to connect again later.(S1039)
        //
        //      1027 - Faild to create character. Please try to connect again.(S1027)
        //      1028 - Select a Weapon
        //      1029 - A maximum of %d characters can be created
        //      1036 - Exceeded the letter limit.\nOnly 12 English letters are available. [Min., Max.]
        //      1037 - Invalid character name. 
        //      1040 - This ID already exists.
        //      1041 - This user is already connected. the user may still be connected because of an error that foreced the game to close. Please try again in 5 minutes.
        //      1042 - Faild to create character. Please try to connect again.(S1042)
        //      1044 - Cannot connect to the server because the server reached its capacity.
        //      1045 - Login failed(S1045)