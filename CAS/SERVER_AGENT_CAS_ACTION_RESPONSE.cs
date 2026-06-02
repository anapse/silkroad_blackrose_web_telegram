        //Opcode: 0xA314
        //Name: SERVER_CAS_ACTION_RESPONSE
        //Description:
        //Encryption: false
        //Massive: true
        1   byte    CASClientAction
        switch(CASClientAction)
        {
            case SubmitHelpRequest:
                1   byte    result
                if(result == 0x02)
                {
                    1   byte    errorCode
                }
            break;            
            
            case RequestCompletedHelpRequests:
                1   byte    result
                if(result == 0x01)
                {
                    1   byte    CompletedHelpRequests
                    foreach(CompletedHelpRequest)
                    {
                        4   uint    CASSerial
                        20  char[]  ProcessedGM
                        1024    char[]  Answer
                        2   ushort  ProcessDate.Year
                        2   ushort  ProcessDate.Month
                        2   ushort  ProcessDate.Day
                        2   ushort  ProcessDate.Hour
                        2   ushort  ProcessDate.Minute
                        2   ushort  ProcessDate.Second
                        2   ushort  ProcessDate.Microsecond
                        1   byte    unk1 //=> Check for != 0
                    }                        
                }
                else if(result == 0x02)
                {
                    1   byte    errorCode
                }
            break;
            
            case DeleteCompletedHelpRequest:
                1   byte    result
                if(result == 0x01)
                {
                    4   uint    CASSerial
                }
                else if(result == 0x02)
                {
                    1   byte    errorCode
                }
            break;
            
            case AcceptGMCall:
                1   byte    result
                if(result == 0x01)
                {
                    4   uint    CallID
                }
                else if(result == 0x02)
                {
                    1   byte    errorCode
                }
            break;
            
            case RefuseGMCall:
                1   byte    result
                if(result == 0x01)
                {
                    4   uint    CallID
                }
                else if(result == 0x02)
                {
                    1   byte    errorCode
                }
            break;            
        }