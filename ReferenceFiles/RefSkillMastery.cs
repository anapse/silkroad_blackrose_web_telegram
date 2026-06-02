    public struct RefSkillMastery
    {
        public int ID;
        public string Name;
        public string NameCode;
        public byte GroupNum;
        public string Description;
        public string TabNameCode;
        public byte TabID;

        public byte SkillToolTipType;
        //0:무기술일반  
        //1:기공술일반  
        //2:기혈대법류.. 
        //3. 유럽마스터리
        //(렙이 올라도 그 스킬들에 영향을 안미치는 스킬)

        public byte WeaponType1;
        public byte WeaponType2;
        public byte WeaponType3;
        public string Icon;
        public string FocusIcon;
    }

//Mastery ID: 257
//Mastery Name - Do Not Use: 비천검법101
//MasteryNameCode: UIIT_STT_MASTERY_VI
//GroupNum: 10
//Mastery Description ID: UIIT_STT_MASTERY_VI_EXPLANATION
//Tab Name Code: UIIT_CTL_WEAPON_SKILL
//Type (TabID): 0
//SkillToolTipType: 0
//Weapon Type 1: 2
//Weapon Type 2: 3
//Weapon Type 3: 0
//Mastery Icon: icon\skillmastery\china\mastery_sword.ddj
//Mastery Focus Icon: icon\skillmastery\china\mastery_sword_focus.ddj