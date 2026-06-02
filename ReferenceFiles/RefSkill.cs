    public struct RefSkill
    {
        public byte Service;
        public int ID;
        public int GroupID;
        public string Basic_Code;
        public string Basic_Name;
        public string Basic_Group;
        public int Basic_Original;
        public byte Basic_Level;
        public byte Basic_Activity;
        public int Basic_ChainCode;
        public int Basic_RecycleCost;
        public int Action_PreparingTime;
        public int Action_CastingTime;
        public int Action_ActionDuration;
        public int Action_ReuseDelay;
        public int Action_CoolTime;
        public int Action_FlyingSpeed;
        public byte Action_Interruptable;
        public int Action_Overlap;
        public int Action_AutoAttackType;
        public int Action_InTown;
        public short Action_Range;
        public byte Target_Required;
        public byte TargetType_Animal;
        public byte TargetType_Land;
        public byte TargetType_Building;
        public byte TargetGroup_Self;
        public byte TargetGroup_Ally;
        public byte TargetGroup_Party;
        public byte TargetGroup_Enemy_M;
        public byte TargetGroup_Enemy_P;
        public byte TargetGroup_Neutral;
        public byte TargetGroup_DontCare;
        public byte TargetEtc_SelectDeadBody;
        public int ReqCommon_Mastery1;
        public int ReqCommon_Mastery2;
        public byte ReqCommon_MasteryLevel1;
        public byte ReqCommon_MasteryLevel2;
        public short ReqCommon_Str;
        public short ReqCommon_Int;
        public int ReqLearn_Skill1;
        public int ReqLearn_Skill2;
        public int ReqLearn_Skill3;
        public byte ReqLearn_SkillLevel1;
        public byte ReqLearn_SkillLevel2;
        public byte ReqLearn_SkillLevel3;
        public int ReqLearn_SP;
        public byte ReqLearn_Race;
        public byte Req_Restriction1;
        public byte Req_Restriction2;
        public byte ReqCast_Weapon1;
        public byte ReqCast_Weapon2;
        public short Consume_HP;
        public short Consume_MP;
        public short Consume_HPRatio;
        public short Consume_MPRatio;
        public byte Consume_WHAN;
        public byte UI_SkillTab;
        public byte UI_SkillPage;
        public byte UI_SkillColumn;
        public byte UI_SkillRow;
        public string UI_IconFile;
        public string UI_SkillName;
        public string UI_SkillToolTip;
        public string UI_SkillToolTip_Desc;
        public string UI_SkillStudy_Desc;
        public short AI_AttackChance;
        public byte AI_SkillType;
        public List<int> Params; //list of 50 params
    }

//Service                     1
//ID                          3
//GroupID                     174
//Basic_Code                  SKILL_CH_SWORD_SMASH_A_01
//Basic_Name                  검:비천일검
//Basic_Group                 SKILL_CH_SWORD_SMASH_A
//Basic_Original              0
//Basic_Level                 1
//Basic_Activity              2
//Basic_ChainCode             0
//Basic_RecycleCost           99999999
//Action_PreparingTime        0
//Action_CastingTime          411
//Action_ActionDuration       1022
//Action_ReuseDelay           3000
//Action_CoolTime             0
//Action_FlyingSpeed          0
//Action_Interruptable        0
//Action_Overlap              33554432
//Action_AutoAttackType       1
//Action_InTown               0
//Action_Range                0
//Target_Required             1
//TargetType_Animal           1
//TargetType_Land             0
//TargetType_Building         0
//TargetGroup_Self            0
//TargetGroup_Ally            0
//TargetGroup_Party           0
//TargetGroup_Enemy_M         1
//TargetGroup_Enemy_P         1
//TargetGroup_Neutral         0
//TargetGroup_DontCare        0
//TargetEtc_SelectDeadBody    0
//ReqCommon_Mastery1          257
//ReqCommon_Mastery2          0
//ReqCommon_MasteryLevel1     5
//ReqCommon_MasteryLevel2     0
//ReqCommon_Str               0
//ReqCommon_Int               0
//ReqLearn_Skill1             0
//ReqLearn_Skill2             0
//ReqLearn_Skill3             0
//ReqLearn_SkillLevel1        0
//ReqLearn_SkillLevel2        0
//ReqLearn_SkillLevel3        0
//ReqLearn_SP                 1
//ReqLearn_Race               0
//Req_Restriction1            0
//Req_Restriction2            0
//ReqCast_Weapon1             2
//ReqCast_Weapon2             3
//Consume_HP                  0
//Consume_MP                  19
//Consume_HPRatio             0
//Consume_MPRatio             0
//Consume_WHAN                0
//UI_SkillTab                 0
//UI_SkillPage                255
//UI_SkillColumn              0
//UI_SkillRow                 0
//UI_IconFile                 skill\china\sword_smash_a.ddj
//UI_SkillName                SN_SKILL_CH_SWORD_SMASH_A
//UI_SkillToolTip             xxx
//UI_SkillToolTip_Desc        SN_SKILL_CH_SWORD_SMASH_A_TT_DESC
//UI_SkillStudy_Desc          SN_SKILL_CH_SWORD_SMASH_A_STUDY
//AI_AttackChance             0
//AI_SkillType                0
//Param1                      0
//Param2                      6386804
//Param3                      5
//Param4                      143
//Param5                      16
//Param6                      20
//Param7                      143
//Param8                      1734702198
//Param9                      1296122196
//Param10                     0
//Param11                     0
//Param12                     0
//Param13                     0
//Param14                     0
//Param15                     0
//Param16                     0
//Param17                     0
//Param18                     0
//Param19                     0
//Param20                     0
//Param21                     0
//Param22                     0
//Param23                     0
//Param24                     0
//Param25                     0
//Param26                     0
//Param27                     0
//Param28                     0
//Param29                     0
//Param30                     0
//Param31                     0
//Param32                     0
//Param33                     0
//Param34                     0
//Param35                     0
//Param36                     0
//Param37                     0
//Param38                     0
//Param39                     0
//Param40                     0
//Param41                     0
//Param42                     0
//Param43                     0
//Param44                     0
//Param45                     0
//Param46                     0
//Param47                     0
//Param48                     0
//Param49                     0
//Param50                     0


//Params:
//6386804 = att
//  Param1: Type
//          Types:
//             5 = Phy. atk. pwr.
//             6 = 
//  Param2: Physical percentage
//  Param3: Min
//  Param4: Max
//  Param5: Magical percentage?


//1734702198 = getv -> "getVariable"
//  Param1: Name

//1936028790 = setv -> "setVariable"
//  Param1: Name
//  Param2: Value
//  Param3: Value2


//Variables:
//1296122196 = MAAT -> ""
//1160860481 = E1SA -> ""
//1380992085 = RPDU -> "Poison Damage increase"
//1380996181 = RPTU -> "Poisoning Effect increase"
//to be continued...