    public class RefObjItem : RefObjCommon
    {
        public int MaxStack;
        public ItemGender ReqGender;
        public int ReqStr;
        public int ReqInt;
        public byte ItemClass; //Degree = ROUND(ItemClass / 3, UP)
        public int SetID;
        public float Dur_L; //Durability - lower bound
        public float Dur_U; //Durability - upper bound
        public float PD_L; //Physical defense - lower bound
        public float PD_U; //Physical defense - upper bound
        public float PDInc; //Physical defense - increase
        public float ER_L; //Evasion rate (Parry rate) - lower bound
        public float ER_U; //Evasion rate (Parry rate) - upper bound
        public float ERInc; //Evasion rate (Parry rate) - increase
        public float PAR_L; //Physical absorb rate - lower bound
        public float PAR_U; //Physical absorb rate - upper bound
        public float PARInc; //Physical absorb rate - increase
        public float BR_L; //Block rate - lower bound
        public float BR_U; //Block rate - upper bound
        public float MD_L; //Magical defense - lower bound
        public float MD_U; //Magical defense - upper bound
        public float MDInc; //Magical defense - increase
        public float MAR_L; //Magical absorb rate - lower bound
        public float MAR_U; //Magical absorb rate - upper bound
        public float MARInc; //Magical absorb rate - increase
        public float PDStr_L; //Physical (defense) reinforce - lower bound
        public float PDStr_U; //Physical (defense) reinforce - upper bound
        public float MDInt_L; //Magical (defense) reinforce - lower bound
        public float MDInt_U; //Magical (defense) reinforce - upper bound

        public byte Quivered; //Consumes ammo
        //TypeID1   TypeID2     TypeID3
        //3         3           4
        public byte Ammo1_TID4;
        public byte Ammo2_TID4;
        public byte Ammo3_TID4;
        public byte Ammo4_TID4;
        public byte Ammo5_TID4;

        public byte SpeedClass; //Seems to be ether 2 for weapons or 0 for everything else
        public byte TwoHanded;
        public short Range;

        public float PAttackMin_L; //Physical attack power (minimum) - lower bound
        public float PAttackMin_U; //Physical attack power (minimum) - upper bound
        public float PAttackMax_L; //Physical attack power (maximum) - lower bound
        public float PAttackMax_U; //Physical attack power (maximum) - upper bound
        public float PAttackInc; //Physical attack power - increase
        public float MAttackMin_L; //Physical attack power (minimum) - lower bound
        public float MAttackMin_U; //Physical attack power (minimum) - upper bound
        public float MAttackMax_L; //Physical attack power (maximum) - lower bound
        public float MAttackMax_U; //Physical attack power (maximum) - upper bound
        public float MAttackInc; //Physical attack power - increase
        public float PAStrMin_L; //Physical (attack) reinforce (minimum) - lower bound
        public float PAStrMin_U; //Physical (attack) reinforce (minimum) - upper bound
        public float PAStrMax_L; //Physical (attack) reinforce (maximum) - lower bound
        public float PAStrMax_U; //Physical (attack) reinforce (maximum) - upper bound
        public float MAInt_Min_L; //Magical (attack) reinforce (minimum) - lower bound
        public float MAInt_Min_U; //Magical (attack) reinforce (minimum) - upper bound
        public float MAInt_Max_L; //Magical (attack) reinforce (maximum) - lower bound
        public float MAInt_Max_U; //Magical (attack) reinforce (maximum) - upper bound
        public float HR_L; //Hit Rate (Attack rate) - lower bound
        public float HR_U; //Hit Rate (Attack rate) - upper bound
        public float HRInc; //Hit Rate (Attack rate) - increase
        public float CHR_L; //Critical - lower bound
        public float CHR_U; //Critical - upper bound
        public List<int> Params; //List of 20 params
        public byte MaxMagicOptCount;
        public byte ChildItemCount;
    }

//ID                  int
//MaxStack            50
//ReqGender           2
//ReqStr              0
//ReqInt              0
//ItemClass           1
//SetID               0
//Dur_L               0.0
//Dur_U               0.0
//PD_L                0.0
//PD_U                0.0
//PDInc               0.0
//ER_L                0.0
//ER_U                0.0
//ERInc               0.0
//PAR_L               0.0
//PAR_U               0.0
//PARInc              0.0
//BR_L                0.0
//BR_U                0.0
//MD_L                0.0
//MD_U                0.0
//MDInc               0.0
//MAR_L               0.0
//MAR_U               0.0
//MARInc              0.0
//PDStr_L             0.0
//PDStr_U             0.0
//MDInt_L             0.0
//MDInt_U             0.0
//Quivered            0
//Ammo1_TID4          0
//Ammo2_TID4          0
//Ammo3_TID4          0
//Ammo4_TID4          0
//Ammo5_TID4          0
//SpeedClass          0
//TwoHanded           0
//Range               0
//PAttackMin_L        0.0
//PAttackMin_U        0.0
//PAttackMax_L        0.0
//PAttackMax_U        0.0
//PAttackInc          0.0
//MAttackMin_L        0.0
//MAttackMin_U        0.0
//MAttackMax_L        0.0
//MAttackMax_U        0.0
//MAttackInc          0.0
//PAStrMin_L          0.0
//PAStrMin_U          0.0
//PAStrMax_L          0.0
//PAStrMax_U          0.0
//MAInt_Min_L         0.0
//MAInt_Min_U         0.0
//MAInt_Max_L         0.0
//MAInt_Max_U         0.0
//HR_L                0.0
//HR_U                0.0
//HRInc               0.0
//CHR_L               0.0
//CHR_U               0.0
//Param1              120
//Desc1_128           HP회복양
//Param2              0
//Desc2_128           HP회복양(%)
//Param3              0
//Desc3_128           MP회복양
//Param4              0
//Desc4_128           MP회복양(%)
//Param5              -1
//Desc5_128           xxx
//Param6              -1
//Desc6_128           xxx
//Param7              -1
//Desc7_128           xxx
//Param8              -1
//Desc8_128           xxx
//Param9              -1
//Desc9_128           xxx
//Param10             -1
//Desc10_128          xxx
//Param11             -1
//Desc11_128          xxx
//Param12             -1
//Desc12_128          xxx
//Param13             -1
//Desc13_128          xxx
//Param14             -1
//Desc14_128          xxx
//Param15             -1
//Desc15_128          xxx
//Param16             -1
//Desc16_128          xxx
//Param17             -1
//Desc17_128          xxx
//Param18             -1
//Desc18_128          xxx
//Param19             -1
//Desc19_128          xxx
//Param20             -1
//Desc20_128          xxx
//MaxMagicOptCount    0
//ChildItemCount      0