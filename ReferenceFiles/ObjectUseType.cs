    public enum ObjectUseType : byte
    {
        //Bit 1: AskBeforeUsing
        //Bit 8: CanBeUsed
        ClassA = 0,   //0 000000 0
        ClassB = 1,   //0 000000 1
        ClassC = 129, //1 000000 1 
        ClassD = 255, //1 111111 1
    }
