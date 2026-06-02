    public class RefObjCommon
    {
        public byte Service; //bool -> Indicates whether object is used or not.
        public int ID; //in packet reference described as RefObjID
        public string CodeName;
        public string ObjName; //Korean -> Localize by NameStrID
        public string OrgObjCodeName; //reference codeName to original object used by clones
        public string NameStrID; //reference for ObjName localization (SN_CODENAME)
        public string DescStrID; //references for Description localization (CODENAME_TT_DESC) 
        public byte CashItem; //bool -> Indicates whether object belongs to Item Mall or not
        public byte Bionic; //bool
        public byte TypeID1;
        public byte TypeID2;
        public byte TypeID3;
        public byte TypeID4;
        public int DecayTime; //time in milliseconds until object despawns
        public ObjectCountry Country; //Indicates where object is from
        public ObjectRarity Rarity;

        public byte CanTrade; //bool
        public byte CanSell; //bool
        public byte CanBuy; //bool
        public ObjectBorrowType CanBorrow; //link to ObjectBorrowType
        public ObjectDropType CanDrop; //link to ObjectDropType
        public byte CanPick; //bool
        public byte CanRepair; //bool
        public byte CanRevive; //bool
        public ObjectUseType CanUse; //link to ObjectUseType
        public byte CanThrow; //bool -> only ITEM_FORT_SHOCK_BOMB

        public int Price;
        public int CostRepair;
        public int CostRevive;
        public int CostBorrow;
        public int KeepingFee; //Storage cost
        public int SellPrice;

        public ObjectReqLevelType ReqLevelType1;
        public byte ReqLevel1;
        public ObjectReqLevelType ReqLevelType2;
        public byte ReqLevel2;
        public ObjectReqLevelType ReqLevelType3;
        public byte ReqLevel3;
        public ObjectReqLevelType ReqLevelType4;
        public byte ReqLevel4;

        public int MaxContain;

        public short RegionID; //for "STORE_" objects
        public short Dir; //unused
        public short OffsetZ; //for "STORE_" objects
        public short OffsetX; //for "STORE_" objects
        public short OffsetY; //for "STORE_" objects

        public short Speed1; //WalkSpeed
        public short Speed2; //RunSpeed

        public int Scale;

        public short BCHeight; //for object selection
        public short BCRadius; //for object selection

        public int EventID;

        public string AssocFileObj;
        public string AssocFileDrop;
        public string AssocFileIcon;
        public string AssocFile1;
        public string AssocFile2;
    }
