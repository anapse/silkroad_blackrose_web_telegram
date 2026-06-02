        //Opcode: 0x7007
        //Name: CLIENT_AGENT_CHARACTER_SELECTION_REQUEST
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort CLIENT_AGENT_CHARACTER_SELECTION_REQUEST = 0x7007;
        // 1   byte    type*
        // if(type == 0x01)
        // {
            // 2   ushort  Name.Lenght
            // *   string  Name
            // 4   uint    RefObjID
            // 1   byte    Scale
            // 4   uint    RefItemID - BODY
            // 4   uint    RefItemID - LEG
            // 4   uint    RefItemID - FOOT
            // 4   uint    RefItemID - WEAPON
        // }
        // else if(type = 0x03 || type == 0x04 || type == 0x05)
        // {
            // 2   ushort  Name.Lenght
            // *   string  Name
        // }
        /*Types:
        /    01 - Create
        /    02 - List
        /    03 - Delete
        /    04 - Check name
        /    05 - Restore