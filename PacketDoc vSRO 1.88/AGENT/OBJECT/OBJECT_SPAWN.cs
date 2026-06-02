//TODO: REDO BASED ON OBJECT TYPES NOT "CodeName"

    4   ushort  RefObjID    
    switch(RefObject.Type) //from Reference
    {
        case CHARACTER: //CHAR_
            1   byte    Scale
            1   byte    HwanLevel
            1   byte    PVPCape(0=None, 1=Red, 2=Gray, 3=Blue, 4=White, 5=Orange)
            1   byte    AutoInverstExp(1 = Beginner Icon, 2 = Helpful, 3 = Beginner&Helpful)
            1   byte    Inventory.Size
            1   byte    Inventory.ItemCount
            foreach(InventoryItem)
            {
                4   uint    Item.ID
                1   byte    Item.OptLevel
            }
            1   byte    AvatarInventory.Size
            1   byte    AvatarInventory.ItemCount
            foreach(AvatarInventoryItem)
            {
                4   uint    AvatarItem.ID
                1   byte    AvatarItem.OptLevel
            }
            1   byte    MaskFlag
            if(MaskFlag)
            {
                4   uint    Mask.RefObjID
                if(Mask.RefObject.Type == CHARACTER)
                {
                    1   byte    Mask.Volume
                    1   byte    Mask.ItemCount
                    foreach(Mask.Item)
                    {
                        4   uint    Item.ID
                    }
                }
            }
            
            4   uint    UniqueID
            4   ushort  RegionID (=> XSec; YSec)
            4   float   XOffset
            4   float   ZOffset
            4   float   YOffset
            1   byte    DestinationFlag
            1   byte    MovementType(0 = Walking, 1 = Running)
            if(DestinationFlag)
            {
                1   byte    DestXSec
                1   byte    DestYSec
                2   ushort  DestX
                2   ushort  DestZ
                2   ushort  DestY
            }
            else
            {
                1   byte    SourceFlag (1 = Sky-/ArrowKey-walking)
                2   ushort  Angle
            }
                1   byte    StateFlag(1 = Alive, 2 = Dead)
                1   byte    *unk07 -> Check for != 0
                1   byte    Action (0 = None, 2 = Walking, 3 = Running, 4 = Sitting)
                1   byte    Status(0 = None,2 = ??*@GrowthPet*, 3 = Invincible, 4 = Invisible)
                4   float   WalkSpeed
                4   float   RunSpeed
                4   float   HwanSpeed
                1   byte    ActiveBuffCount
                foreach(ActiveBuff)
                {
                    RefSkillID
                    TimedJobID
                    if(RefSkill.Param2 is 1701213281 -> atfe -> "auto transfer effect" like Recovery Division)
                    {
                        1   byte    Creator
                    }
                }
                2   ushort  Name.Lenght
                *   string  Name
                1   byte    JobType (0 = None, 1 = Trader, 2 = Tief, 3 = Hunter)
                1   byte    JobLevel
                1   byte    RideFlag
                1   byte    AttackFlag
                if(RideFlag)
                {
                    4   ushort  Transport.UniqueID
                }
                1   byte    *unk
                1   byte    StallFlag(4 = Stalling)
                1   byte    *unk
                2   ushort  Guild.Name.Lenght
                *   string  Guild.Name
                4   uint    Guild.ID
                2   ushort  Nickname.Lenght
                *   string  Nickname		(=> Grandname)
                4   uint    Guild.CurCrestRev
                4   uint    Union.ID
                4   uint    Union.CurCrestRev
                1   byte    *unk
                1   byte    FortressWarPosition(1 = Commander at fortress war, 2 = Deputy commander at fortress war, ...)
                if(StallFlag == 4)
                {
                    2	ushort	Stall.Name.Lenght
                    *	string	Stall.Name
                    4	uint	Stall.RefObjID
                }
                1	byte	EquipmentCountdown (10 to 0) (=> While changing Job/PVP Cape)
                1	byte	PKFlag(255 = Disable, 34 = Enable)
        break;  
        
        case NPC: //NPC_
            4   uint    UniqueID
            4   ushort  RegionID (=> XSec; YSec)
            4   float   XOffset
            4   float   ZOffset
            4   float   YOffset
            1   byte    DestinationFlag
            1   byte    MovementType(0 = Walking, 1 = Running)
            if(DestinationFlag)
            {
                1   byte    DestXSec
                1   byte    DestYSec
                2   ushort  DestX
                2   ushort  DestZ
                2   ushort  DestY
            }
            else
            {
                1   byte	SourceFlag (1 = Sky-/ArrowKey-walking)
                2   ushort	Angle
            }
                1   byte    StateFlag(1 = Alive, 2 = Dead)
                1   byte    *unk07 -> Check for != 0
                1   byte    Action (0 = None, 2 = Walking, 3 = Running, 4 = Sitting)
                1   byte    Status(0 = None, 2 = GrowthPet->Tracing? , 3 = Invincible, 4 = Invisible)
                4   float   WalkSpeed
                4   float   RunSpeed
                4   float   HwanSpeed
                1   byte    ActiveBuffCount (=> Not entirely sure -> Check if != 0)
                //foreach(ActiveBuff)
                //{
                //	RefSkillID
                //	TimedJobID
                //	if(RefSkill.Param2 is 1701213281 -> atfe -> "auto transfer effect" like Recovery Division)
                //	{
                //		1	byte	Creator
                //	}
                //}
                1   byte    TalkFlag (0 = None, 2 = Talk)
                if(TalkFlag == 2)
                {
                    1   byte    TalkOptionCount
                    foreach(TalkOption)
                    {
                        1   byte    TalkOption
                    }
                }
        break;
        
        case PET: //COS_
            4   uint    UniqueID
            4   ushort  RegionID (=> XSec; YSec)
            4   float   XOffset
            4   float   ZOffset
            4   float   YOffset
            1   byte    DestinationFlag
            1   byte    MovementType(0 = Walking, 1 = Running)
            if(DestinationFlag)
            {
                1   byte    DestXSec
                1   byte    DestYSec
                2   ushort  DestX
                2   ushort  DestZ
                2   ushort  DestY
            }
            else
            {
                1   byte    SourceFlag (1 = Sky-/ArrowKey-walking)
                2   ushort  Angle
            }
            1   byte    StateFlag(1 = Alive, 2 = Dead)
            1   byte    *unk07 -> Check for != 0
            1   byte    Action (0 = None, 2 = Walking, 3 = Running, 4 = Sitting)
            1   byte    Status(0 = None, 2 = GrowthPet->Tracing? , 3 = Invincible, 4 = Invisible)
            4   float   WalkSpeed
            4   float   RunSpeed
            4   float   HwanSpeed
            1   byte    AttackFlag
            1   byte    *unk
            if(RefObj.Type == AbilityPet || RefObj.Type == GrowthPet || RefObj.Type == TradeCOS)
            2	ushort	Name.Lenght
            *	string	Name
            2	ushort	Owner.Name.Lenght
            *	string	Owner.Name
            1	byte	*unk
            if(RefObj.Type == GrowthPet || RefObj.Type == TradeCOS) //Reason behind this is, that you can attack the pet even if the owner is not in range.
            {
                1   byte    Owner.MurderFlag(1 = Purple, 2 = Red)
            }
            4   uint    Owner.UniqueID	
        break;
            
        case PORTAL: //STORE_ or INS_QUEST_TELEPORT
            //TID1,TID2,TID3
            //4,1,1
            //4,1,2
            4   uint    UniqueID
            4   ushort  RegionID (=> XSec; YSec)
            4   float   XOffset
            4   float   ZOffset
            4   float   YOffset
            2   ushort  Angle
            1   byte    *unk1
            1   byte    *unk2
            1   byte    *unk3
            1   byte    *unk4
            if(*unk4 == 1)
            {
                4   uint    *unk5
                4   uint    *unk6
            }
            else if(*unk4 == 6)
            {
                2   ushort  Owner.Lenght
                *   string  Owner
                4   uint    RefObjID of Dimension Pillar
            }
        break;
        
        case MONSTER: //MOB_
            
        break;
        
        case ITEM: //ITEM_
        
        break;
        
        case STRUCTURE:
            4   uint    HP
            4   uint    RefEventStructID
            2   ushort  State
            4   uint    UniqueID
            4   ushort  RegionID (=> XSec; YSec)
            4   float   XOffset
            4   float   ZOffset
            4   float   YOffset
            1   byte    DestinationFlag
            1   byte    MovementType(0 = Walking, 1 = Running)
            if(DestinationFlag)
            {
                1   byte    DestXSec
                1   byte    DestYSec
                2   ushort  DestX
                2   ushort  DestZ
                2   ushort  DestY
            }
            else
            {
                1   byte    SourceFlag (1 = Sky-/ArrowKey-walking)
                2   ushort  Angle
            }
            1   byte    StateFlag(1 = Alive, 2 = Dead)
            1   byte    *unk07 -> Check for != 0
            1   byte    Action (0 = None, 2 = Walking, 3 = Running, 4 = Sitting)
            1   byte    Status(0 = None, 2 = GrowthPet->Tracing? , 3 = Invincible, 4 = Invisible)
            4   float   WalkSpeed
            4   float   RunSpeed
            4   float   HwanSpeed
            1   byte    AttackFlag
            1   byte    TalkMode
            
            
            //TypeIDs
            //without:
            //1,2,5,3 = STRUCTURE_BIG_GATE_CT_01
            //1,2,5,4 = STRUCTURE_SMALL_DEFENSIVE_POSITION_00
            // = STRUCTURE_POS_CT_GATE_01
            
            //with:
            //1,2,5,5 = STRUCTURE_HEADQUARTERS_00
            4   uint    *unk    (=> OwnerGuild?)
            
            
        case OTHER: //RefObjID = 0xFFFFFF
        
    }