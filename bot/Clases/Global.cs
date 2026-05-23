namespace bot.Clases
{
    using System;

    internal class Global
    {

        public static ServerEnum Server = ServerEnum.None;

        public enum ServerEnum
        {
            None,
            Gateway,
            Agent
        }
    }
}

