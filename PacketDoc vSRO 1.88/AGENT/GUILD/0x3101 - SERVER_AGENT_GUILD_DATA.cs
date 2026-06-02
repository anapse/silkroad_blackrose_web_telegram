        //Opcode: 0x3101
        //Name: SERVER_AGENT_GUILD_DATA
        //Description:
        //Encryption: false
        //Massive: false
        4   uint    Guild.ID
        2   ushort  Guild.Name.Length
        *   string  Guild.Name
        1   byte    Guild.Level
        4   uint    Guild.GatheredSP
        2   ushort  Guild.MasterCommentTitle.Length
        *   string  Guild.MasterCommentTitle
        2   ushort  Guild.MasterComment.Length
        *   string  Guild.MasterComment
        4   uint    Guild.CurCrestRev
        1   byte    Guild.MercenaryAttr
        1   byte    Guild.MemberCount
        foreach(Guild.Member)
        {
            4   uint    Member.CharID
            2   ushort  Member.Name.Length
            *   string  Member.Name
            1   byte    Member.MemberClass (0 = Master, ? = Vice master, 10 = Member) //Vice master may implemented but needs to be reversed :/
            1   byte    Member.Level
            4   uint    Member.GP_Donation
            4   uint    Member.Permission
            4   uint    Member.Contribution
            4   uint    Member.GuildWarKill
            4   uint    Member.GuildWarKilled
            2   ushort  Member.Nickname.Length
            *   string  Member.Nickname
            4   uint    Member.RefObjID
            1   byte    Member.SiegeAuthority
            1   byte    Member.Status (00 = Online, 01 = Offline)
//            #if GUILD_UI_IMPROVEMENT
//                99 66                                             RegionID
//                0B 46 2B 92                                       .F+.............
//                CB FD 7B 00                                       ..{.............
//                00                                                LevelUpLast7Days
//            #endif
        }