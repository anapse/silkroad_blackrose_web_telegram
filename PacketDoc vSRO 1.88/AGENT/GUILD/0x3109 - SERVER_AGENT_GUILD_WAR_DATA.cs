        //Opcode: 0x3109
        //Name: SERVER_AGENT_GUILD_WAR_DATA
        //Description:
        //Encryption: false
        //Massive: false
        1   byte    GuildWars
        foreach(GuildWar)
        {
            4   uint    GuildWar.ID
            4   uint    GuildWar.WarEndTime
            1   byte    GuildWar.VictoryPointIndex
            4   uint    GuildWar.LodgedGold
            4   uint    GuildWar.Guild1
            4   uint    GuildWar.Guild2
            4   uint    GuildWar.PointGain1
            4   uint    GuildWar.PointGain2
            2   ushort  GuildWar.HostileGuild.Name.Length
            *   string  GuildWar.HostileGuild.Name
        }