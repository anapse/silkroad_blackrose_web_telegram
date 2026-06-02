    public enum ObjectRarity : byte
    {
        ClassA = 0, //White
        ClassB = 1, //Blue
        ClassC = 2, //Yellow (SOX)
        ClassD = 3, //SET
        ClassE = 4, //
        ClassF = 5, //
        ClassG = 6, //ROC SET       
        ClassH = 7, //LEGEND
        ClassI = 8 //

        //For ITEM_: see above, this rarity is also used in SERVER_AGENT_OBJECT_SPAWN when OBJECT equals ITEM...
        //For COS_T / TRADE_COS: it might be used for TIEF/HUNTER AI target priority since behemoth and lvl60+ cos are is higher than normal ones
        //For MOB_: it could affect on spawn chance unless its a unique?
    }
