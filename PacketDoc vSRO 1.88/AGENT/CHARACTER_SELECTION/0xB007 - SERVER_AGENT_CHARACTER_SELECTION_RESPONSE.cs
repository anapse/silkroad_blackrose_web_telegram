        //Opcode: 0xB007
        //Name: SERVER_AGENT_CHARACTER_SELECTION_RESPONSE
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_AGENT_CHARACTER_SELECTION_RESPONSE = 0xB007;
        // 1   byte    Type*
        // 1   byte    result
        // if(result == 0x01 && type == 0x02)
        // {
            // 1   byte    CharacterCount
            // foreach(Character)
            // {
                // 4   uint    RefObjID
                // 2   ushort  Name.Length
                // *   string  Name
                // 1   byte    Scale
                // 1   byte    CurLevel
                // 8   ulong   ExpOffset
                // 2   ushort  STR
                // 2   ushort  INT
                // 2   ushort  AP (Stat Points)
                // 4   uint    HP 
                // 4   uint    MP
                // 1   byte    DeleteFlag
                // if(DeleteFlag == 0x01)
                // {
                    // 4   uint    DeleteTime in Minutes
                // }
                // 1   byte    GuildFlag [0x01 == Member, 0x02 == Master]
                // 1   byte    GuildRenameFlag
                // if((GuildRenameFlag == 0x01)
                // {
                    // 2   ushort  Guild.Name.Length
                    // *   string  Guild.Name
                // }
                // 1   byte    AcademyFlag [0x01 = Member, 0x02 = Master)
                // 1   byte    ItemCount
                // foreach(Item)
                // {
                    // 4   uint    RefItemID
                    // 1   byte    Plus
                // }
                // 1   byte    AvatarItemCount
                // foreach(AvatarItem)
                // {
                    // 4   uint    RefItemID
                    // 1   byte    Plus
                // }
            // }
        // }
        // else if(result == 0x02)
        // {
            // 2   ushort  errorCode**
        // }              
        //  *Types:
        //      01 - Create
        //      02 - List
        //      03 - Delete
        //      04 - NameCheck
        //      05 - Restore
        //
        //  **ErrorCodes:
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