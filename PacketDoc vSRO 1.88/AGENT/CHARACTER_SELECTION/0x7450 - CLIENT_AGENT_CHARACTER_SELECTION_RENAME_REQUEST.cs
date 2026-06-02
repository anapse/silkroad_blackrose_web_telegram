        //Opcode: 0x7450
        //Name: CLIENT_AGENT_CHARACTER_SELECTION_RENAME_REQUEST
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort CLIENT_AGENT_CHARACTER_SELECTION_RENAME_REQUEST = 0x7450;
        // 1   byte    Type (0x01 = Character, 0x02 = Guild, 0x03 = GuildNameCheck)
        // switch(type)
        // {
            // case 0x01:
            // case 0x02:
                // 2   ushort  curName.Length
                // *   string  curName
                // 2   ushort  newName.Length
                // *   string  newName
            // break;
        
            // case: 0x03:
                // 2   ushort  Name.Length
                // *   string  Name
            // break;
        // }

        //  *Types:
        //      01 - Character rename
        //      02 - Guild rename
        //      03 - Guild name check