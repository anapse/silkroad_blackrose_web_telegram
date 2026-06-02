        //Opcode: 0x6314
        //Name: CLIENT_CAS_ACTION_REQUEST
        //Description:
        //Encryption: false
        //Massive: true
        1   byte    CASClientAction
        switch(CASClientAction)
        {
            case SubmitHelpRequest:
                2   ushort  ShardID
                1   byte    RequestedCategory
                2   ushort  MailAdress.Lenght
                *   string  MailAdress
                4   uint    UserJID
                2   ushort  CharName.Lenght
                *   string  CharName
                2   ushort  TgtCharName.Lenght
                *   string  TgtCharName
                2   ushort  Statement.Lenght
                *   string  Statement
                2   ushort  ChatLog.Lenght
                *   string  ChatLog
            break;

            case RequestCompletedHelpRequests: 
                2   ushort  CharName.Lenght
                *   string  CharName
            break;
            
            case DeleteCompletedHelpRequest:
                4   uint    CASSerial
            break;
            
            case AcceptGMCall:
                4   uint    CallID
            break;
            
            case RefuseGMCall:
                4   uint    CallID
            break;            
        }