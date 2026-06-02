    public enum ObjectBorrowType : byte
    {
        //Bit 1: EXCHANGE ?
        //Bit 2: STORAGE / GUILD_STORAGE ?
        //Bit 3: PET2 ?
        //Bit 4-8: ???

        ClassA = 000, //0 0 0 00000
        ClassB = 128, //1 0 0 00000
        ClassC = 159, //1 0 0 11111
        ClassD = 160, //1 0 1 00000
        ClassE = 223, //1 1 0 11111
        ClassF = 192, //1 1 0 00000
        ClassG = 255, //1 1 1 11111
    }