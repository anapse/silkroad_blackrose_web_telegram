        //Opcode: 0x6315
        //Name: SERVER_CAS_ACTION_REQUEST
        //Description:
        //Encryption: false
        //Massive: true
        4   uint    MessageCount   //Not entirely sure about this, since the message gets forwarded back and forth GlobalServer<->FarmManager<->AgentServer<->Client
                                   //GlobalServer's ServiceID = 1, just saying. Tested on MessageCount = 2 -> only first received message appeared
        foreach(Message)
        {
            4   uint    MessageID
            1   byte    CASServerAction
            switch(CASServerAction)
            {
                case NotifyCompletedRequest:
                    2   ushort  CharName.Length
                    *   string  CharName
                    4   uint    CASSerial
                    2   ushort  ProcessedGM.Length
                    *   string  ProcessedGM
                    2   ushort  Answer.Length
                    *   string  Answer
                    2   ushort  ProcessDate.Year
                    2   ushort  ProcessDate.Month
                    2   ushort  ProcessDate.Day
                    2   ushort  ProcessDate.Hour
                    2   ushort  ProcessDate.Minute
                    2   ushort  ProcessDate.Second
                    2   ushort  ProcessDate.Microsecond
                break;
                
                case CreateGMCall:
                    4   uint    CallID
                    2   ushort  GM.Length
                    *   string  GM                    
                break;
                
                case SendGMCallMessage:
                    4   uint    CallID
                    2   ushort  Message.Length
                    *   string  Message    
                break;
                
                case EndGMCallSession:
                    4   uint    CallID
                break;
            }
        }