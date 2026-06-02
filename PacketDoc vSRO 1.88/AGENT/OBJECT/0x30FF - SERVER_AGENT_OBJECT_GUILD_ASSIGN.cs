        //Opcode: 0x30FF
        //Name:	SERVER_AGENT_SHARED_ENTITY_GUILD_ASSIGN
        //Description:
        //Encrypted: false
        //Massive: false
        4   uint    UniqueID
        4   uint    GuildID
        2   ushort  GuildName.Length
        *   string  GuildName
        2   ushort  GrandName.Length
        *   string  GrandName
        4   uint    GuildLastCrestRev
        4   uint    UnionID
        4   uint    UnionLastCrestRev
        1   byte    *unk0 -> Check != 0 //Related to GuildWar, like in fight or something?!
        1   byte    FortressWarPosition