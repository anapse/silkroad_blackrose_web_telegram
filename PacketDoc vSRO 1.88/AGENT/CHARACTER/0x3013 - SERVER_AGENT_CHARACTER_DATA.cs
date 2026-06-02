        //Opcode: 0x3013
        //Name: SERVER_AGENT_CHARACTER_DATA
        //Description:
        //Encryption: false
        //Massive: false
        public const ushort SERVER_AGENT_CHARACTER_DATA = 0x3013;
        //  4   uint    LastLogin (TimeStamp)
        //  4   uint    RefObjID
        //  1   byte    Scale
        //  1   byte    Level
        //  1   byte    MaxLevel
        //  8   ulong   ExpOffset
        //  4   uint    SExpOffset
        //  8   ulong   RemainGold
        //  4   uint    RemainSkillPoint
        //  2   ushort  RemainStatPoint
        //  1   byte    RemainHwanCount
        //  4   uint    GatheredExpPoint (Use?)
        //  4   uint    HP
        //  4   uint    MP
        //  1   byte    AutoInverstExp(1 = Beginner Icon, 2 = Helpful, 3 = Beginner&Helpful)
        //  1   byte    DailyPK
        //  2   ushort  TotalPK
        //  4   uint    PKPenaltyPoint
        //  1   byte    HwanLevel
        //  1   byte    PVPCape
        //  1   byte    Inventory.Size
        //  1   byte    Inventory.Items.Count
        //  foreach(inventoryItem)
        //  {
        //      1   byte    Item.Slot
        //      4   uint    Item.RentType
        //      switch(Item.RentType)
        //      {
        //          case 1:
        //              2   ushort  Item.Rent.CanDelete (adds "Will be deleted when time period is over" to item)
        //              4   uint    Item.Rent.PeriodBeginTime
        //              4   uint    Item.Rent.PeriodEndTime
        //          break;
        //      
        //          case 2:
        //              2   ushort  Item.Rent.CanDelete (adds "Will be deleted when time period is over" to item)
        //              2   ushort  Item.Rent.CanRecharge (adds "Able to extend" to item)
        //              4   uint    Item.Rent.MeterRateTime
        //          break;
        //      
        //          case 3:
        //              2   ushort  Item.Rent.CanDelete (adds "Will be deleted when time period is over" to item)
        //              4   uint    Item.Rent.PeriodBeginTime
        //              4   uint    Item.Rent.PeriodEndTime
        //              2   ushort  Item.Rent.CanRecharge (adds "Able to extend" to item)
        //              4   uint    Item.Rent.PackingTime
        //          break;
        //      }
        //      
        //      4   uint    Item.RefItemID
        //      switch(Item.ItemType)   //from Reference
        //      {
        //          case "Equipment":
        //              1   byte    InventoryItem.OptLevel
        //              8   ulong   InventoryItem.Variance
        //              4   uint    InventoryItem.Data (=> Durability)
        //              1   byte    InventoryItem.MagParamNum (=> Blue, Red )
        //              ForEach(MagParam)
        //              {
        //                  4   uint    MagParam.Type
        //                  4   uint    MagParam.Value
        //              }
        //              1   byte    OptType (1 => Socket)
        //              1   byte    OptCount
        //              ForEach(Option)
        //              {
        //                  1   byte    Option.Slot
        //                  4   uint    Option.ID
        //                  4   uint    Option.nParam1 (=> Reference to Socket)
        //              }
        //              1   byte    OptType (2 => Advanced elixir)
        //              1   byte    OptCount
        //              ForEach(Option)
        //              {
        //                  1   byte    Option.Slot
        //                  4   uint    Option.ID
        //                  4   uint    Option.OptValue (=> "Advanced elixir in effect [+OptValue]")
        //              }
        //              //Notice for Advanced Elixir modding.
        //              //Mutiple adv elixirs only possible with db edit. nOptValue of last nSlot will be shown as elixir in effect but total Plus value is correct
        //              //You also have to fix error when "Buy back" from NPC
        //              //## Stored procedure Error(-1): {?=CALL _Bind_Option_Manager (3, 174627, 1, 0, 0, 0, 0, 0, 0)} ## D:\WORK2005\Source\SilkroadOnline\Server\SR_GameServer\AsyncQuery_Storage.cpp AQ_StorageUpdater::DoWork_AddBindingOption 1366
        //              //Storage Operation Failed!!! [OperationType: 34, ErrorCode: 174627]
        //              //Query: {CALL _STRG_RESTORE_SOLDITEM_ITEM_MAGIC (174628, ?, ?, 34, 6696,13, 137,8,0,137, 1,4294967506,0,0,0,0,0,0,0,0,0,0,0,199970734269)}
        //              //AQ Failed! Log out!! [AQType: 1]			
        //          break;
        //      
        //          case "AttributeStone":
        //          case "MagicStone":
        //              2   ushort  StackCount
        //              1   byte    AttributeAssimilationProbability
        //          break;
        //          
        //          case "GrowthPet"
        //          case "AbilityPet"
        //              1   byte    Status (1 = Unsumonned, 2 = Summoned, 3 = Alive, 4 = Dead)
        //              4   uint    RefObjID
        //              2   ushort  Name.Lenght
        //              *   string  Name
        //              if(AbilityPet)
        //              {
        //                  4   uint    SecondsToRentEndTime
        //              }
        //              1   byte    *unk02 -> Check for != 0
        //          break;
        //          
        //          case "Item Exchange Coupon"
        //              2   ushort  StackCount
        //              1   byte    MagParamNum
        //              ForEach(MagParam)
        //              {
        //                  8   ulong   MagParam.Value
        //                  //1. MagParam => CouponRefItemID [fixed]
        //                  //2. MagParam => CouponItemAmount [fixed]
        //                  //When Coupon holds Scrolls or similar, these 2 MagParams above are used.
        //                  //When Coupon holds Equipment, 8 MagParams are used
        //                  //They are defined in database by "[BIIV]<M:str,1,3><M:int,1,3><O:3>"
        //                  //As MagParams we get those 2 above and
        //                  //01 4D 01 72 74 73 00 00                           MagParam3 - .M.rts..........	(=> There is our str, don't ask me why its reversed)
        //                  //03 00 00 00 00 00 00 00                           MagParam4 - MagParam.Value		(=> Amount of +STR)
        //                  //01 4D 01 74 6E 69 00 00                           MagParam5 - .M.tni..........	(=> There is our int, don't ask me why its reversed)
        //                  //03 00 00 00 00 00 00 00                           MagParam6 - MagParam.Value		(=>	Amount of +INT)
        //                  //01 4F 00 00 00 00 00 00                           MagParam7 - .O..............	(=> There is our O for OptLevel)
        //                  //03 00 00 00 00 00 00 00                           MagParam8 - OptLevel			(=> Amount of +Overall)
        //              }   
        //          break;
        //          
        //          case "Magic Cube":
        //              4   uint    StoredItemCount
        //          break;
        //          
        //          case default:
        //              2   ushort  StackCount
        //          break;        
        //  }
        //  
        //  1   byte    Character.AvatarInventory.Size
        //  1   byte    Character.AvatarInventory.Items.Count
        //  foreach(AvatarItem)
        //  {
        //      1   byte    Item.Slot
        //      4   uint    Item.RentType
        //      switch(Item.RentType)
        //      {
        //          case 1:
        //              2   ushort  Item.Rent.CanDelete (adds "Will be deleted when time period is over" to item)
        //              4   uint    Item.Rent.PeriodBeginTime
        //              4   uint    Item.Rent.PeriodEndTime
        //          break;
        //      
        //          case 2:
        //              2   ushort  Item.Rent.CanDelete (adds "Will be deleted when time period is over" to item)
        //              2   ushort  Item.Rent.CanRecharge (adds "Able to extend" to item)
        //              4   uint    Item.Rent.MeterRateTime
        //          break;
        //      
        //          case 3:
        //              2   ushort  Item.Rent.CanDelete (adds "Will be deleted when time period is over" to item)
        //              4   uint    Item.Rent.PeriodBeginTime
        //              4   uint    Item.Rent.PeriodEndTime
        //              2   ushort  Item.Rent.CanRecharge (adds "Able to extend" to item)
        //              4   uint    Item.Rent.PackingTime
        //          break;
        //      }
        //      
        //      4   uint    Item.RefItemID
        //      switch(Item.ItemType)   //from Reference
        //      {
        //          case "Equipment":
        //              1   byte    InventoryItem.OptLevel
        //              8   ulong   InventoryItem.Variance
        //              4   uint    InventoryItem.Data (=> Durability)
        //              1   byte    InventoryItem.MagParamNum (=> Blue, Red )
        //              ForEach(MagParam)
        //              {
        //                  4   uint    MagParam.Type
        //                  4   uint    MagParam.Value
        //              }
        //              1   byte    OptType (1 => Socket)
        //              1   byte    OptCount
        //              ForEach(SocketOption)
        //              {
        //                  1   byte    Option.Slot
        //                  4   uint    Option.ID
        //                  4   uint    Option.nParam1 (=> Reference to Socket)
        //              }
        //              1   byte    OptType (2 => Advanced elixir)
        //              1   byte    OptCount
        //              ForEach(AdvOption)
        //              {
        //                  1   byte    Option.Slot
        //                  4   uint    Option.ID
        //                  4   uint    Option.OptValue (=> "Advanced elixir in effect [+OptValue]")
        //              }
        //              //Notice for Advanced Elixir modding.
        //              //Mutiple adv elixirs only possible with db edit. nOptValue of last nSlot will be shown as elixir in effect but total Plus value is correct
        //              //You also have to fix error when "Buy back" from NPC
        //              //## Stored procedure Error(-1): {?=CALL _Bind_Option_Manager (3, 174627, 1, 0, 0, 0, 0, 0, 0)} ## D:\WORK2005\Source\SilkroadOnline\Server\SR_GameServer\AsyncQuery_Storage.cpp AQ_StorageUpdater::DoWork_AddBindingOption 1366
        //              //Storage Operation Failed!!! [OperationType: 34, ErrorCode: 174627]
        //              //Query: {CALL _STRG_RESTORE_SOLDITEM_ITEM_MAGIC (174628, ?, ?, 34, 6696,13, 137,8,0,137, 1,4294967506,0,0,0,0,0,0,0,0,0,0,0,199970734269)}
        //              //AQ Failed! Log out!! [AQType: 1]			
        //          break;
        //      }
        //  }
        //  
        //  1   byte    unk03 -> Check for != 0 (MaskFlag?)
        //  
        //  1   byte    MasteryFlag [0 = done, 1 = Mastery]
        //  while(MasteryFlag = 1)
        //  {
        //      4   uint    Mastery.ID
        //      1   byte    Mastery.Level
        //  
        //      1   byte    MasterFlag (0 = done, 1 = Mastery)
        //  }
        //  
        //  1   byte    SkillFlag [0 = done, 1 = Skill]
        //  while(SkillFlag = 1)
        //  {
        //      4   uint    Skill.ID
        //      1   byte    Skill.Enable
        //  
        //      1   byte    SkillFlag (0 = done, 1 = Skill)
        //  }
        //  
        //  2   ushort  CompletedQuestCount
        //  foreach(CompletedQuet)
        //  {
        //      4   uint    RefQuestID
        //  }
        //  1   byte    ActiveQuestCount
        //  foreach(ActiveQuest)
        //  {
        //      4   uint    Quest.ID
        //      1   byte    Quest.AchievementCount (Repetition Amount = Bit && Completetion Amount = Bit)
        //      1   byte    Quest.*unk04 -> Check for != 0
        //      1   byte    Quest.Type (8 = , 24 = , 88 = )
        //      1   byte    Quest.Status (1 = Untouched, 7 = Started, 8 = Complete)
        //      1   byte    Quest.ObjectiveCount
        //      foreach(Objective)
        //      {
        //          1   byte    Objective.ID
        //          1   byte    Objective.Status (00 = done, 01 = incomplete)
        //          2   ushort  Objective.Name.Length
        //          *   string  Objective.Name
        //          1   byte    Objective.TaskCount
        //          foreach(ObjectiveTask)
        //          {
        //              4   uint    Task.Value (=> Killed monsters; Collected items)
        //          }
        //      }
        //      if(Quest.Type == 88 || Quest.Type)
        //      {
        //          1   byte    Quest.TaskCount
        //          foreach(QuestTask)
        //          {
        //              4   uint    RefObjID (=> NPCs to deliver to, when complete you get reward)
        //          }
        //      }
        //  }
        //  
        //  1   byte    *unk05 -> Check for != 0
        //  4   uint    *unk06 -> Check for != 0
        //  
        //  4   uint    UniqueID
        //  4   ushort  RegionID (=> XSec; YSec)
        //  4   float   XOffset
        //  4   float   ZOffset
        //  4   float   YOffset
        //  1   byte    DestinationFlag
        //  1   byte    MovementType(0 = Walking, 1 = Running)
        //  if(DestinationFlag)
        //  {
        //      1   byte    DestXSec
        //      1   byte    DestYSec
        //      2   ushort  DestX
        //      2   ushort  DestZ
        //      2   ushort  DestY
        //  }
        //  else
        //  {
        //      1   byte    SourceFlag (1 = Sky-/ArrowKey-walking)
        //      2   ushort  Angle
        //  }
        //  1   byte    StateFlag(1 = Alive, 2 = Dead)
        //  1   byte    *unk07 -> Check for != 0
        //  1   byte    Action (0 = None, 2 = Walking, 3 = Running, 4 = Sitting)
        //  1   byte    Status(0 = None,2 = ??*@GrowthPet*, 3 = Invincible, 4 = Invisible)
        //  4   float   WalkSpeed
        //  4   float   RunSpeed
        //  4   float   HwanSpeed
        //  1   byte    ActiveBuffCount
        //  foreach(ActiveBuff)
        //  {
        //      4   uint    RefSkillID
        //      4   uint    TimedJobID
        //      if(RefSkill.Params contains "1701213281") //=> atfe -> "auto transfer effect" like Recovery Division)
        //      {
        //          1   byte    Creator
        //      }
        //  }
        //  
        //  2   ushort  Name.Length
        //  *   string  Name
        //  2   ushort  JobName.Length
        //  *   string  JobName
        //  1   byte    JobType (0 = None, 1 = Trader, 2 = Tief, 3 = Hunter)
        //  1   byte    JobLevel
        //  4   uint    JobExp
        //  4   uint    JobContribution
        //  4   uint    JobReward
        //  1   byte    *unk08 -> Check for != 0    //(According to Spawn structure => MurderFlag?)
        //  1   byte    *unk09 -> Check for != 0    //(According to Spawn structure => RideFlag or AttackFlag?)
        //  1   byte    *unk10 -> Check for != 0    //(According to Spawn structure => EquipmentCountdown?)
        //  1   byte    PK Flag(255 = Disable, 34 = Enable)
        //  8   ulong   CompleteTutorials (Binary)
        //  4   uint    JID (=> GameAccountID)
        //  1   byte    GMFlag
        //  1   byte    Activation (0 = character not activated, 7 = character activated)
        //  1   byte    HotkeyCount
        //  foreach(Hotkey)
        //  {
        //      1   byte    SlotSeq
        //      1   byte    SlotContentType
        //      4   uint    Data
        //  }
        //  1   byte    HP Slot (FValue * 10 + Slot)
        //  1   byte    HP Value (Enabled = 128 + Value)
        //  1   byte    MP Slot(FValue * 10 + Slot)
        //  1   byte    MP Value(Enabled = 128 + Value)
        //  1   byte    Universal Slot (Enabled = 128 + Value)
        //  1   byte    Universal Value(Enabled = 128,0 = Disabled)
        //  1   byte    Potion Delay(Enabled = 128 + Value)
        //  
        //  1   byte    BlockedPlayCount
        //
        //  foreach(BlockedPlayer)
        //  {
        //      2   ushort  TargetName.Length
        //      *   string  TargetName
        //  }
        //  4   uint    *unk13
        //  1   byte    *unk14