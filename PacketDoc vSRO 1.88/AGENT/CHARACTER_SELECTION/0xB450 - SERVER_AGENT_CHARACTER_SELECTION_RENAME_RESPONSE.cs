        //Opcode: 0xB450
        //Name: SERVER_AGENT_CHARACTER_SELECTION_RENAME_RESPONSE
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_AGENT_CHARACTER_SELECTION_RENAME_RESPONSE = 0xB450;
        //  1   byte    Type*
        //  1   byte    result
        //  if(result == 0x02)
        //  {
        //      2   ushort  errorCode**
        //  }        
        //  *Types:
        //      01 - Character rename
        //      02 - Guild rename
        //      03 - Guild name check
        //
        //  **ErrorCodes:
        //      *for Type 0x01
        //      02 00 - Unknown error.(S2)
        //      03 00 - Unknown error.(S2)
        //      04 00 - Unknown error.(S2)
        //      05 00 - Unknown error.(S2)
        //      06 00 - This ID already exists.
        //      07 00 - Invalid character name.                
        //      *for Type 0x02
        //      02 00 - Unknown error.(S2)
        //      03 00 - Unknown error.(S2)
        //      04 00 - Unknown error.(S2)
        //      05 00 - Unknown error.(S2)
        //      06 00 - The selected guild name already exists.
        //      07 00 - The guild cannot be created.                
        //      *For Type 0x03
        //      02 00 - Unknown error.(S2)
        //      03 00 - Unknown error.(S2)
        //      04 00 - Unknown error.(S2)
        //      05 00 - Unknown error.(S2)
        //      06 00 - The selected guild name already exists.
        //      07 00 - The guild cannot be created.