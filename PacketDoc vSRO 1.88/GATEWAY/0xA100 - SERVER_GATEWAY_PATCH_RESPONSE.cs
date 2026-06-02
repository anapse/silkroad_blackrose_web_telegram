        //Opcode: 0xA100
        //Name: SERVER_GATEWAY_PATCH_RESPONSE
        //Description: Response to 0x6100
        //Encryption: false
        //Massive: true
        public const ushort SERVER_GATEWAY_PATCH_RESPONSE = 0xA100;
        //  1   byte    result [0x01 = Sucess, 0x02 == Error]
        //  if(result == 0x02)
        //  {
        //      1   byte    errorCode*
        //      if(errorCode == 0x02) 
        //      {
        //          2   ushort  DownloadServer.IP.Length
        //          *   string  DownloadServer.IP
        //          2   ushort  DownloadServer.Port
        //          4   uint    Version
        //          1   byte    FileFlag [0 = Done, 1 = NextFile]
        //          while (FileFlag == 0x01)
        //          {
        //              4   uint    File.ID
        //              2   ushort  File.Name.Length
        //              *   string  File.Name
        //              2   ushort  File.Path.Length
        //              *   string  File.Path
        //              4   uint    File.Length
        //              1   byte    ToBePacked
        //
        //              1   byte    FileFlag [0 = Done, 1 = NextFile]
        //          }
        //  *ErrorCodes:
        //  	by Launcher:
        //      	1 - "Invalid client. Program will be terminated."
        //      	2 - **UPDATE**
        //      	3 - "Invalid client. Program will be terminated. "
        //      	4 - "The server is undergoing inspection or updates. Connect to %website% for more information."
        //      	5 - "You have to install the full version. Move to offical website to download the full version?"
        //  	by Client:
        //      	1 - "Faild to connect to server.(C4)"
        //      	2 - "BSObj Plugin:\nCan't create file transfer manager!\nMaybe back file corrupted or someone is already accessing it now.. try few minuts later." **Client can't patch, exceute launcher
        //      	3 - "Faild to connect to server.(C4)"
        //      	4 - "Servers are offline. Please visit our homepage to check when they are back."