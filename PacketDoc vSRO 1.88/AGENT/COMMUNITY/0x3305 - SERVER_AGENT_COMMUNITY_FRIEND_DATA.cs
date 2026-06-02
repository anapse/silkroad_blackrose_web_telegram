        //Opcode: 0x3305
        //Name: SERVER_AGENT_COMMUNITY_FRIEND_DATA
        //Description:
        //Encryption: false
        //Massive: false
        1   byte    FriendCount
        foreach(Friend)
        {
            4   uint    Friend.CharID
            2   ushort  Friend.Name.Length
            *   string  Friend.Name
            4   uint    Friend.RefObj
            1   byte    Friend.Status (0 = Online, 1 = Offline)
        }