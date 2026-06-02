        //Opcode: 0x6316
        //Name: CLIENT_CAS_ACTION_RESPONSE
        //Description:
        //Encryption: false
        //Massive: true
        4   uint    MessageCount
        foreach(Message)
        {
            4   uint    MessageID
            1   byte    CASServerAction
            switch(CASServerAction)            
            {
                case NotifyCompletedRequest:
                case CreateGMCall:
                case SendGMCallMessage:
                case EndGMCallSession:                    
                    1   byte    result
                    //if(result == 0x02) //I don't think SR_Client will ever be allowed to choose an ErrorCode for the Server :D
                    //{
                    //    1   byte    errorCode
                    //}
                break;        
            }
        }