        //Opcode: 0xA101
        //Name: SERVER_GATEWAY_SERVERLIST_RESPONSE
        //Description: Response to 0x6101
        //Encryption: false
        //Massive: false
        public const ushort SERVER_GATEWAY_SERVERLIST_RESPONSE = 0xA101;
        //  1   byte    GlobalOperationFlag   [0x00 = done, 0x01 = NextGlobalOperation]
        //  while(OperationFlag == 0x01)
        //  {
        //      1   byte    GlobalOperation.Type*
        //      2   ushort  GlobalOperation.Name.Lenght
        //      *   string  GlobalOperation.Name
        //      
        //      1   byte    OperationFlag [0x00 = done, 0x01 = NextOperation]
        //  }        
        //        
        //  1   byte    ShardFlag   [0x00 = done, 0x01 = NextShard]
        //  while(ShardFlag == 0x01)
        //  {
        //      2   ushort  Shard.ID
        //      2   ushort  Shard.Name.Lenght
        //      *   string  Shard.Name
        //      2   ushort  Shard.Current
        //      2   ushort  Shard.Capacity
        //      1   byte    Status  [0x00 = Online, 0x01 = Checked]
        //      1   byte    GlobalOperationID
        //
        //      1   byte    ShardFlag   [0x00 = done, 0x01 = NextShard]
        //  }
        //  *GlobalOperationTypes:
        //      01=Silkroad_Dev
        //      02=Silkroad_Korea_Yahoo_Official
        //      03=Silkroad_Korea_Yahoo_Test_IN
        //      04=SRO_China_Official
        //      05=SRO_China_TestLocal
        //      06=Silkroad_Joymax
        //      07=JoymaxMessenger
        //      08=ServiceManager
        //      09=SRO_China_TestIn
        //      10=SRO_Taiwan_TestIn
        //      11=SRO_Taiwan_TestLocal
        //      12=SRO_Taiwan_Official
        //      13=SRO_DEEPDARK
        //      14=SRO_Taiwan_BillingTest
        //      15=SRO_Japan_Official
        //      16=SRO_Japan_TestLocal
        //      17=SRO_Japan_TestIn
        //      18=SRO_Global_TestBed
        //      19=SRO_Global_TestBed_In
        //      20=SRO_EuropeTest
        //      21=SRO_Vietnam_TestIn
        //      22=SRO_Vietnam_TestLocal
        //      23=SRO_Net2E_Official
        //      24=Yahoo_Official_Test
        //      25=SRO_GNGWC_TestIn
        //      26=SRO_GNGWC_Official
        //      27=SRO_China_OpenTest
        //      29=SRO_GNGWC_Official_Final
        //      30=CPRJ_Dev
        //      31=SRO_INTERNAL_EU
        //      32=SRO_INTERNAL_EU_QUEST
        //      33=Vietnam_Dev
        //      34=SRO_China_EuroTest
        //      35=SRO_Taiwan_FOS CB
        //      36=SRO_GameOn_Official_Test
        //      37=SRO_Thailand_TestLocal
        //      38=SRO_Thailand_Official
        //      39=SRO_Russia_TestLocal
        //      40=SRO_Russia_Official
        //      41=SRO_Japan_TestOTP
        //      42=SRO_Global_TestBed_OT
        //      43=SRO_Japan_CGI_TestIn
        //      44=SRO_Japan_TestLocal_We
        //      45=SRO_R_JP_TestLocal_We
        //      46=SRO_R_JP_RealLocal_We
        //      47=SRO_R_CH_TestLocal_CIMO
        //      48=SRO_R_CH_RealLocal_CIMO