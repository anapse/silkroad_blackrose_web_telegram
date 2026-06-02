        //Opcode: 0x3102
        //Name: SERVER_AGENT_UNION_DATA
        //Description:
        //Encryption: false
        //Massive: false
        4   uint    Union.ID
        2   uint    Union.CurCrestRev
        2   uint    Union.LeadGuild.ID
        1   byte    Union.MemberCount
        foreach(UnionMember)
        {
            4   uint    UnionMember.ID
            2   ushort  UnionMember.Name.Length
            *   string  UnionMember.Name
            1   byte    UnionMember.Level
            2   ushort  UnionMember.Master.Name.Length
            *   string  UnionMember.Master.Name
            4   uint    UnionMember.Master.RefObjID
            1   byte    UnionMember.MemberCount
        }