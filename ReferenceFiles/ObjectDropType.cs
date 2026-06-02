    public enum ObjectDropType : byte
    {
        ClassA = 0, //000000 0 0 -> Can't drop
        ClassB = 1, //000000 0 1 -> Do not ask before drop?
        ClassC = 2, //000000 1 0 -> Unseen but this is the 'ask before drop' bit?
        ClassD = 3, //000000 1 1 -> Ask then drop
    }