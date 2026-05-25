using bot.Clases.infoclass;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;

namespace bot.Clases.Logica.Training
{
    class Stuck
    {
        public struct Stuck_Mob_
        {
            public System.Timers.Timer timer;
            public uint id;
        }

        public static Stuck_Mob_[] stucked_mobs = new Stuck_Mob_[200];

        public static void AddMob(uint id, int seconds)
        {
            bool exist = false;
            for (int i = 0; i < stucked_mobs.Length; i++)
            {
                if (stucked_mobs[i].id == id)
                {
                    exist = true;
                    break;
                }
            }
            if (exist == false)
            {
                for (int i = 0; i < stucked_mobs.Length; i++)
                {
                    if (stucked_mobs[i].id == 0)
                    {
                        foreach (Monster monster in Monster.SpawnMob)
                        {
                            if (id == monster.UniqueID)
                            {
                                monster.Status = 1;
                                stucked_mobs[i].id = id;
                                try
                                {
                                    stucked_mobs[i].timer.Stop();
                                    stucked_mobs[i].timer.Dispose();
                                }
                                catch { }
                                stucked_mobs[i].timer = new System.Timers.Timer();
                                stucked_mobs[i].timer.Interval = seconds * 1000 + 1;
                                stucked_mobs[i].timer.Elapsed += new ElapsedEventHandler(stucked_mob_elapsed);
                                stucked_mobs[i].timer.Start();
                                stucked_mobs[i].timer.Enabled = true;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }

        static void stucked_mob_elapsed(object? sender, ElapsedEventArgs e)
        {
            var timer = sender as System.Timers.Timer;
            if (timer == null)
                return; // 
            for (int i = 0; i < stucked_mobs.Length; i++)
            {
                if (stucked_mobs[i].timer == timer)
                {
                    foreach (Monster monster in Monster.SpawnMob)
                    {
                       
                            if (monster.UniqueID == stucked_mobs[i].id)
                            {
                                monster.Status = 0;
                                break;
                            }
                        }
                        stucked_mobs[i].timer.Stop();
                    stucked_mobs[i].timer.Dispose();
                    stucked_mobs[i] = new Stuck_Mob_();
                    break;
                }
            }
        }

        public static void DeleteMob(uint id)
        {
            for (int i = 0; i < stucked_mobs.Length; i++)
            {
                if (stucked_mobs[i].id == id)
                {
                    stucked_mobs[i] = new Stuck_Mob_();
                    break;
                }
            }
        }
    }
}