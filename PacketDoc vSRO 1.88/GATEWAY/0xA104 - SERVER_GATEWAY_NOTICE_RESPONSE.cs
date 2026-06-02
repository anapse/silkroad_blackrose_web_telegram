        //Opcode: 0xA104
        //Name: SERVER_GATEWAY_NOTICE_RESPONSE
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_GATEWAY_NOTICE_RESPONSE = 0xA104;
        //  1   byte    NoticeCount
        //  ForEach(Notice)
        //  {
        //      2   ushort  Subject.Length
        //      *   string  Subject
        //      2   ushort  Article.Length
        //      *   string  Article
        //      2   ushort  Year
        //      2   ushort  Month
        //      2   ushort  Day
        //      2   ushort  Hour
        //      2   ushort  Minute
        //      2   ushort  Second
        //      4   uint    Microsecond
        //  }