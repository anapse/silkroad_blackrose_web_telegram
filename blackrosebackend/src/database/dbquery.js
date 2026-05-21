const datosplayer =
  "select *  from SRO_VT_SHARD.._Char left join SRO_VT_SHARD.._CharTrijob on [SRO_VT_SHARD].[dbo].[_Char].CharID = [SRO_VT_SHARD].[dbo].[_CharTrijob].CharID  \
		left join SRO_VT_SHARD.._RefLevel on [SRO_VT_SHARD].[dbo].[_Char].CurLevel = [SRO_VT_SHARD].[dbo].[_RefLevel].Lvl  \
		left join SRO_VT_SHARD.._Guild on SRO_VT_SHARD.._Guild.ID = [SRO_VT_SHARD].[dbo].[_Char].GuildID  \
		left join [SRO_VT_LOG].[dbo].[Statuschar] on [SRO_VT_SHARD].[dbo].[_Char].CharID = [SRO_VT_LOG].[dbo].[Statuschar].CharID \
		left join SRO_VT_Proxy.._TotalPointRanking on _char.charname16 COLLATE DATABASE_DEFAULT = SRO_VT_Proxy.._TotalPointRanking.Charname \
		left Join SRO_VT_SHARD.._CharSkillMastery on [SRO_VT_SHARD].[dbo].[_Char].CharID =  SRO_VT_SHARD.._CharSkillMastery.CharID \
	  where  charname16 not like 'd'  and SRO_VT_SHARD.._CharSkillMastery.Level >0  and charname16 = @Char ";

export const cantplateronline =
  "SELECT top 1  nUserCount as Onlines FROM SRO_VT_ACCOUNT.._ShardCurrentUser WHERE nShardID = 64 ORDER BY nID desc";

export const todaslasnoticias =
  "select * from SRO_APK_ONE.._apk_News order by ID desc";

export const loginin =
  "SELECT StrUserID as Usuario , RefObjID as objid, CharName16 as Char ,silk_own as Silk \
FROM [SRO_VT_ACCOUNT].[dbo].[TB_User] as tbuser left join SRO_VT_SHARD.._User as us on tbuser.JID = us.UserJID \
left join SRO_VT_SHARD.._Char as ch on us.CharID = ch.CharID \
left join SRO_VT_ACCOUNT..SK_Silk as silk on tbuser.JID = silk.JID \
WHERE StrUserID = @ID AND password= @PW order by CurLevel desc";

export const globales =
  "SELECT TOP (@Cant) [Sender],[Content],[TimeSent],rank() over (order by   TimeSent desc  ) as Rnk \
FROM [SRO_VT_PROXY].[dbo].[_LogGlobalChat] where Content like  @Cont order by [TimeSent] desc";

export const rankingsplayers =
  "select top 300 * from SRO_VT_SHARD.._Char left join SRO_VT_SHARD.._CharTrijob on [SRO_VT_SHARD].[dbo].[_Char].CharID = [SRO_VT_SHARD].[dbo].[_CharTrijob].CharID  \
		left join SRO_VT_SHARD.._RefLevel on [SRO_VT_SHARD].[dbo].[_Char].CurLevel = [SRO_VT_SHARD].[dbo].[_RefLevel].Lvl  \
	  where  charname16 not like 'd'  order by  CurLevel desc ,ExpOffset desc ,RemainSkillPoint desc ";

export const inventariochar =
  "SELECT   CharName16, Slot, ItemID,AssocFileIcon128 as Iconimg,RefObjID,InventorySize, MaxStack,  data,  RemainGold, \
Type = CASE WHEN PATINDEX( '%RARE',[SRO_VT_SHARD].[dbo]._RefObjCommon.CodeName128) > 0 THEN 'Sox'  \
WHEN PATINDEX('%ROC%' + '%SET',[SRO_VT_SHARD].[dbo]._RefObjCommon.CodeName128) > 0 THEN 'Roc'  \
ELSE 'Normal' END  \
FROM [SRO_VT_SHARD].[dbo].[_Char]   \
  left join  [SRO_VT_SHARD].[dbo]._Inventory on  [SRO_VT_SHARD].[dbo]._Char.CharID =  [SRO_VT_SHARD].[dbo]._Inventory.CharID  \
  left join  [SRO_VT_SHARD].[dbo]._Items on [SRO_VT_SHARD].[dbo]._Inventory.ItemID = [SRO_VT_SHARD].[dbo]._Items.ID64   \
  left join  [SRO_VT_SHARD].[dbo]._RefObjCommon on [SRO_VT_SHARD].[dbo]._Items.RefItemID = [SRO_VT_SHARD].[dbo]._RefObjCommon.id   \
  left join  [SRO_VT_SHARD].[dbo]._RefObjItem on  [SRO_VT_SHARD].[dbo]._RefObjCommon.Link =  [SRO_VT_SHARD].[dbo]._RefObjItem.ID \
  where CharName16 = @Char order by Slot";

export const rguild =
  "select top 100 rank() over (order by   count(_GuildMember.GuildID)  desc ,GatheredSP desc ) as rnk, name, Lvl,GatheredSP,   \
  FoundationDate,GuildID, count(_GuildMember.GuildID) as miembros  from SRO_VT_SHARD.._Guild left join  SRO_VT_SHARD.._GuildMember on  \
  SRO_VT_SHARD.._Guild.id = SRO_VT_SHARD.._GuildMember.GuildID where ID > 0 and ID != 24 and  \
  name not like '%ulimi%' group by name , Lvl,GatheredSP, FoundationDate,GuildID order by miembros desc ,GatheredSP desc";

const guildmember =
  "select CharName as CharName16,* FROM SRO_VT_SHARD.._GuildMember   WHERE GuildID = @GuilID order by MemberClass asc, CharLevel desc, GP_Donation desc, JoinDate desc";
export const fortres =
  "select * from SRO_VT_SHARD.._SiegeFortress left join SRO_VT_SHARD.._Guild on SRO_VT_SHARD.._SiegeFortress.GuildID = SRO_VT_SHARD.._Guild.ID ";

const uniqstatus =
  "select KillerName as CharName16,* from [SRO_VT_PROXY].[dbo].[_LogUniqueKills]   order by UniqueName asc , KilledTime desc ";

const rjob =
  "select top 100   rank() over (order by   [SRO_VT_SHARD].[dbo].[_CharTrijob].level desc ,  [SRO_VT_SHARD].[dbo].[_CharTrijob].EXP, SRO_VT_Proxy.._TotalPointRanking.ItemPointALL desc  ) as Rnk,   \
[SRO_VT_SHARD].[dbo].[_CharTrijob].JobType as tipodejob ,* from SRO_VT_SHARD.._Char left join SRO_VT_SHARD.._CharTrijob on [SRO_VT_SHARD].[dbo].[_Char].CharID = [SRO_VT_SHARD].[dbo].[_CharTrijob].CharID    \
		left join SRO_VT_SHARD.._RefLevel on [SRO_VT_SHARD].[dbo].[_Char].CurLevel = [SRO_VT_SHARD].[dbo].[_RefLevel].Lvl    \
		left join [SRO_VT_LOG].[dbo].[Statuschar] on [SRO_VT_SHARD].[dbo].[_Char].CharID = [SRO_VT_LOG].[dbo].[Statuschar].CharID   \
		left join SRO_VT_Proxy.._TotalPointRanking on _char.charname16 COLLATE DATABASE_DEFAULT = SRO_VT_Proxy.._TotalPointRanking.Charname   \
	  where  charname16 not like 'd' and charname16 not like '%herrett%' and  [SRO_VT_SHARD].[dbo].[_CharTrijob].JobType != 0 order by  Rnk";

const download = "SELECT * FROM [SRO_VT_ACCOUNT].[dbo].[srcms_downloads]";


const uniqlogplayer ="SELECT [CodeName128],[Killer],count([CodeName128]) as cantidad  \
FROM [SRO_VT_BOTSYSTEM].[dbo].[_UniquesLog]  where Killer  = @Char and CodeName128 not like 'Mob_ev%'  and CodeName128 not like 'Mob_%L3' group by [Killer], CodeName128 order by count([CodeName128]) desc"

const userexiste ="SELECT [StrUserID] FROM [SRO_VT_ACCOUNT].[dbo].[TB_User] where StrUserID = @User"

const registro="insert into [SRO_VT_ACCOUNT].[dbo].TB_User(StrUserID,password,  parola,sec_content,sec_primary,Name, email, AccPlayTime,last_login, LatestUpdateTime_ToPlayTime) values(@ID,@PW, @Contra,3,3,@referido,@Email,0,GETDATE(),0)"
 
const uniqmapmob ="select RegionID, MobName,mobid,time from (select top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Uruchi'  order by Time desc )as uruchi  union  \
 select RegionID, MobName,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'cerberus' order by Time desc) as cerberus  union \
 select RegionID, MobName,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Captain Ivy' order by Time desc) as ivy  union \
 select RegionID, MobName,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Tiger Girl' order by Time desc) as Tigergirl  union \
 select RegionID, MobName,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Isyutaru' order by Time desc) as Isyutaru  union \
 select RegionID, MobName,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Lord Yarkan' order by Time desc) as Lordyarcand  union \
 select RegionID, MobName,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Demon Shaitan' order by Time desc) as Shaytan union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'anubis' order by Time desc) as anubis union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'apis' order by Time desc) as apis union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'isis' order by Time desc) as isis union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'neith' order by Time desc) as neith union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Nephthys' order by Time desc) as Nephthys union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Osiris' order by Time desc) as Osiris union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Sekhmet' order by Time desc) as Sekhmet union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Selket' order by Time desc) as Selket union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Sphinx' order by Time desc) as Sphinx union \
 select regionid, mobname,mobid,time from (select  top 1 * from SRO_VT_LOG.._Region_Event_Log where MobName like 'Horus' order by Time desc) as horus \
 order by MobID asc"
 const inventarioavatar = "SELECT   CharName16, SRO_VT_SHARD.._InventoryForAvatar.Slot,  [SRO_VT_SHARD].[dbo]._InventoryForAvatar.ItemID,AssocFileIcon128 as Iconimg,  \
 avatar = case when TypeID4 = 1 and TypeID3 = 13 and SRO_VT_SHARD.._InventoryForAvatar.Slot between 0 and 4  and SRO_VT_SHARD.._InventoryForAvatar.ItemID !=0 then 'Hat' \
 when TypeID4 = 2 and TypeID3 = 13 and SRO_VT_SHARD.._InventoryForAvatar.Slot between 0 and 3  and SRO_VT_SHARD.._InventoryForAvatar.ItemID !=0  then 'Dress' \
 when TypeID4 = 3 and TypeID3 = 13 and SRO_VT_SHARD.._InventoryForAvatar.Slot between 0 and 3  and SRO_VT_SHARD.._InventoryForAvatar.ItemID !=0 then 'Acc' \
 when TypeID4 = 4 and TypeID3 = 13 and SRO_VT_SHARD.._InventoryForAvatar.Slot between 0 and 3  and SRO_VT_SHARD.._InventoryForAvatar.ItemID !=0 then 'Flag' \
 when TypeID4 = 1 and TypeID3 = 14 and SRO_VT_SHARD.._InventoryForAvatar.Slot = 4  and SRO_VT_SHARD.._InventoryForAvatar.ItemID !=0 then 'Devil' \
 when  SRO_VT_SHARD.._InventoryForAvatar.Slot between 0 and 4  and SRO_VT_SHARD.._InventoryForAvatar.ItemID = 0 then 'avatar vacio' end  \
 FROM [SRO_VT_SHARD].[dbo].[_Char]  left join SRO_VT_SHARD.._InventoryForAvatar on  [SRO_VT_SHARD].[dbo]._Char.CharID =  [SRO_VT_SHARD].[dbo]._InventoryForAvatar.CharID  \
   left join  [SRO_VT_SHARD].[dbo]._Items  on [SRO_VT_SHARD].[dbo]._InventoryForAvatar.ItemID = [SRO_VT_SHARD].[dbo]._Items.ID64   \
   left join  [SRO_VT_SHARD].[dbo]._RefObjCommon on [SRO_VT_SHARD].[dbo]._Items.RefItemID = [SRO_VT_SHARD].[dbo]._RefObjCommon.id    \
   left join  [SRO_VT_SHARD].[dbo]._RefObjItem on  [SRO_VT_SHARD].[dbo]._RefObjCommon.Link =  [SRO_VT_SHARD].[dbo]._RefObjItem.ID  \
 where [SRO_VT_SHARD].[dbo].[_Char].CharName16 = @Char    order by [SRO_VT_SHARD].[dbo].[_Char].CharID,   SRO_VT_SHARD.._InventoryForAvatar.Slot asc" 



const infoitem ="select TextString,ID64, ReqLevel1, Name, Variance, CodeName128,AssocFileIcon128, MaxMagicOptCount, OptLevel, ReqGender, ItemClass, Dur_L, Dur_U, PD_L, PD_U, PDInc, ER_L, ER_U, ERInc, PAR_L, PAR_U, PARInc, BR_L, BR_U, MD_L, MD_U, MDInc, MAR_L, Data, MAR_U, MARInc, PDStr_L, PDStr_U, MDInt_L, MDInt_U, Range as Rangee, PAttackMin_L, PAttackMin_U, PAttackMax_L, PAttackMax_U, PAttackInc, MAttackMin_L, MAttackMin_U, MAttackMax_L, MAttackMax_U, MAttackInc, PAStrMin_U, PAStrMin_L, PAStrMax_L, PAStrMax_U, MAInt_Min_L, MAInt_Min_U, MAInt_Max_L, MAInt_Max_U, HR_L, HR_U, HRInc, CHR_L, CHR_U,  \
CASE WHEN SRO_VT_SHARD.._BindingOptionWithItem.nOptValue = 0 THEN '0' WHEN SRO_VT_SHARD.._BindingOptionWithItem.nOptValue IS NULL THEN 0   \
ELSE SRO_VT_SHARD.._BindingOptionWithItem.nOptValue END ADV,  \
CASE WHEN PATINDEX('%_11%_' + '%A_RARE',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Seal of Death'   \
WHEN PATINDEX('%_11%_' + '%SET_B_RARE',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN ' Egy B'   \
WHEN PATINDEX('%_11%_' + '%SET_A_RARE',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN ' Egy A'  \
WHEN PATINDEX('%A_RARE',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Seal of Star'   \
WHEN PATINDEX('%B_RARE',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Seal of Moon'  \
WHEN PATINDEX('ITEM_ROC_%_' + '%SET',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Seal of Sun'   \
WHEN PATINDEX('%C_RARE',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Seal of Sun' ELSE 'Normal' END Tipoitem,  \
CASE WHEN PATINDEX ('ITEM_%CH%_' + '%CLOTHES%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Garment'   \
WHEN PATINDEX ('ITEM_%CH%_' + '%LIGHT%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Protect'   \
WHEN PATINDEX ('ITEM_%CH%_' + '%HEAVY%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Armor'   \
WHEN PATINDEX ('ITEM_%EU%_' + '%CLOTHES%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Robe'   \
WHEN PATINDEX ('ITEM_%EU%_' + '%LIGHT%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Light Armor'   \
WHEN PATINDEX ('ITEM_%EU%_' + '%HEAVY%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Heavy Armor'  \
WHEN PATINDEX ('ITEM_CH_SWORD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Sword'  \
WHEN PATINDEX ('ITEM_CH_BLADE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Blade'  \
WHEN PATINDEX ('ITEM_CH_BOW%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Bow'  \
WHEN PATINDEX ('ITEM_CH_SHIELD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Shield'  \
WHEN PATINDEX ('ITEM_CH_SPEAR%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Spear'  \
WHEN PATINDEX ('ITEM_CH_TBLADE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Glavie'  \
WHEN PATINDEX ('ITEM_EU_AXE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Dual Axes'  \
WHEN PATINDEX ('ITEM_EU_CROSSBOW%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Crossbow'  \
WHEN PATINDEX ('ITEM_EU_DAGGER%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Dagger'  \
WHEN PATINDEX ('ITEM_EU_DARKSTAFF%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Dark staff'  \
WHEN PATINDEX ('ITEM_EU_HARP%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Harp'  \
WHEN PATINDEX ('ITEM_EU_SHIELD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Shield'  \
WHEN PATINDEX ('ITEM_EU_STAFF%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Light staff'  \
WHEN PATINDEX ('ITEM_EU_TSTAFF%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Twohand staff'  \
WHEN PATINDEX ('ITEM_EU_TSWORD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Twohand sword'   \
WHEN PATINDEX ('ITEM_EU_SWORD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Sword'  \
WHEN PATINDEX ('ITEM_EU_RING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Ring'  \
WHEN PATINDEX ('ITEM_CH_RING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Ring'  \
WHEN PATINDEX ('ITEM_EU_EARRING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Earring'  \
WHEN PATINDEX ('ITEM_CH_EARRING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Earring'  \
WHEN PATINDEX ('ITEM_EU_NECKLACE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Necklace'  \
WHEN PATINDEX ('ITEM_CH_NECKLACE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Necklace'  \
WHEN PATINDEX ('ITEM_%_ARROW%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Arrows/Bolt'  \
WHEN PATINDEX ('ITEM_%_BOLT%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Arrows/Bolt'  \
WHEN PATINDEX ('ITEM_%_quiver%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Arrows/Bolt'  \
WHEN PATINDEX ('ITEM%AVATAR%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Avatar Dress'  \
WHEN PATINDEX ('ITEM%AVATAR%HAT' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Avatar Hat'  \
WHEN PATINDEX ('ITEM%AVATAR%ATTACH' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Avatar Accesory'  \
WHEN PATINDEX ('ITEM%potion%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Recovery pill' \
WHEN PATINDEX ('ITEM%tablet%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Recipe' \
WHEN PATINDEX ('ITEM_COS%scroll' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Summon Scroll' \
WHEN PATINDEX ('ITEM_%return%scroll' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Return Scroll' \
WHEN PATINDEX ('ITEM_%global%chat%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Global chatting' \
WHEN PATINDEX ('%ARCHEMY_UPPER_REINFORCE_RECIPE%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Adv Elixir' \
ELSE '' END Shortitem , \
CASE WHEN PATINDEX ('ITEM_%CH%_' + '%CLOTHES%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirprot'   \
WHEN PATINDEX ('ITEM_%CH%_' + '%LIGHT%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirprot'   \
WHEN PATINDEX ('ITEM_%CH%_' + '%HEAVY%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirprot'   \
WHEN PATINDEX ('ITEM_%EU%_' + '%CLOTHES%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirprot'   \
WHEN PATINDEX ('ITEM_%EU%_' + '%LIGHT%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Light elixirprot'   \
WHEN PATINDEX ('ITEM_%EU%_' + '%HEAVY%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Heavy elixirprot'  \
WHEN PATINDEX ('ITEM_CH_SWORD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_CH_BLADE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_CH_BOW%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_CH_SHIELD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirshield'  \
WHEN PATINDEX ('ITEM_CH_SPEAR%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_CH_TBLADE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_AXE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Dual elixirwea'  \
WHEN PATINDEX ('ITEM_EU_CROSSBOW%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_DAGGER%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_DARKSTAFF%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_HARP%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_SHIELD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirshield'  \
WHEN PATINDEX ('ITEM_EU_STAFF%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_TSTAFF%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_TSWORD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'   \
WHEN PATINDEX ('ITEM_EU_SWORD%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixirwea'  \
WHEN PATINDEX ('ITEM_EU_RING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixiracc'  \
WHEN PATINDEX ('ITEM_CH_RING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixiracc'  \
WHEN PATINDEX ('ITEM_EU_EARRING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixiracc'  \
when PATINDEX ('ITEM_CH_EARRING%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixiracc'  \
WHEN PATINDEX ('ITEM_EU_NECKLACE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixiracc'  \
WHEN PATINDEX ('ITEM_CH_NECKLACE%' ,SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'elixiracc'  \
ELSE '' END Elixir ,  \
CASE WHEN PATINDEX ('ITEM%_' + '%01[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '1 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%02[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '2 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%03[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '3 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%04[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '4 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%05[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '5 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%06[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '6 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%07[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '7 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%08[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '8 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%09[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '9 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%10[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '10 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%11[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '11 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%12[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '12 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%13[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '13 Degrees'   \
WHEN PATINDEX ('ITEM%_' + '%14[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '14 Degrees'   \
WHEN PATINDEX ('ITEM_ROC[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '10 Degrees'  \
WHEN PATINDEX ('ITEM%_' + '%15[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN '15 Degrees'  	 ELSE '' END Degree ,  \
CASE WHEN PATINDEX ('ITEM%[_]CH[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Chinese'   \
WHEN PATINDEX ('ITEM%[_]EU[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'European'  ELSE '' END Raza ,  \
CASE WHEN PATINDEX ('ITEM_%[_]M[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Male'   \
WHEN PATINDEX ('ITEM_%[_]W[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Female' ELSE '' END Genero ,  \
CASE WHEN PATINDEX ('ITEM_%[_]AA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Hands'   \
WHEN PATINDEX ('ITEM_%[_]BA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Chest'   \
WHEN PATINDEX ('ITEM_%[_]CA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Head'   \
WHEN PATINDEX ('ITEM_%[_]FA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Foot'  \
WHEN PATINDEX ('ITEM_%[_]HA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Head'   \
WHEN PATINDEX ('ITEM_%[_]LA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Legs'   \
WHEN PATINDEX ('ITEM_%[_]SA[_]%',SRO_VT_SHARD.._RefObjCommon.Codename128) > 0 THEN 'Shoulder' ELSE '' END Moutingpart ,  \
case when SRO_VT_SHARD.._Items.MagParam1  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam1 ) as bigint)),5,1) as varbinary))) ) end  Blue1,  \
case when SRO_VT_SHARD.._Items.MagParam1  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam1 ) as bigint)),1,1) as varbinary)) )   end VBlue1 ,  \
case when SRO_VT_SHARD.._Items.MagParam2  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam2 ) as bigint)),5,1) as varbinary))) ) end  Blue2,  \
case when SRO_VT_SHARD.._Items.MagParam2  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam2 ) as bigint)),1,1) as varbinary)) )   end VBlue2 ,  \
case when SRO_VT_SHARD.._Items.MagParam3  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam3 ) as bigint)),5,1) as varbinary))) ) end  Blue3,  \
case when SRO_VT_SHARD.._Items.MagParam3  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam2 ) as bigint)),1,1) as varbinary)) )   end VBlue3 ,  \
case when SRO_VT_SHARD.._Items.MagParam4  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam4 ) as bigint)),5,1) as varbinary))) ) end  Blue4,  \
case when SRO_VT_SHARD.._Items.MagParam4  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam4 ) as bigint)),1,1) as varbinary)) )   end VBlue4 ,  \
case when SRO_VT_SHARD.._Items.MagParam5  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam5 ) as bigint)),5,1) as varbinary))) ) end  Blue5,  \
case when SRO_VT_SHARD.._Items.MagParam5  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam5 ) as bigint)),1,1) as varbinary)) )   end VBlue5 ,  \
case when SRO_VT_SHARD.._Items.MagParam6  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam6 ) as bigint)),5,1) as varbinary))) ) end  Blue6,  \
case when SRO_VT_SHARD.._Items.MagParam6  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam6 ) as bigint)),1,1) as varbinary)) )   end VBlue6 ,  \
case when SRO_VT_SHARD.._Items.MagParam7  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam7 ) as bigint)),5,1) as varbinary))) ) end  Blue7,  \
case when SRO_VT_SHARD.._Items.MagParam7  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam7 ) as bigint)),1,1) as varbinary)) )   end VBlue7 ,  \
case when SRO_VT_SHARD.._Items.MagParam8  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam8 ) as bigint)),5,1) as varbinary))) ) end  Blue8,  \
case when SRO_VT_SHARD.._Items.MagParam8  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam8 ) as bigint)),1,1) as varbinary)) )   end VBlue8 ,  \
case when SRO_VT_SHARD.._Items.MagParam9  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam9 ) as bigint)),5,1) as varbinary))) ) end  Blue9,  \
case when SRO_VT_SHARD.._Items.MagParam9  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam9 ) as bigint)),1,1) as varbinary)) )   end VBlue9 ,  \
case when SRO_VT_SHARD.._Items.MagParam10  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam10 ) as bigint)),5,1) as varbinary))) ) end  Blue10,  \
case when SRO_VT_SHARD.._Items.MagParam10  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam10 ) as bigint)),1,1) as varbinary)) )   end VBlue10,  \
case when SRO_VT_SHARD.._Items.MagParam11  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam11 ) as bigint)),5,1) as varbinary))) ) end  Blue11,  \
case when SRO_VT_SHARD.._Items.MagParam11  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam11 ) as bigint)),1,1) as varbinary)) )   end VBlue11 ,  \
case when SRO_VT_SHARD.._Items.MagParam12  is not null  then (SELECT MOptName128  \
FROM sro_vt_shard.._RefMagicOpt  \
where ID = (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast(( MagParam12) as bigint)),5,1) as varbinary))) ) end  Blue12,  \
case when SRO_VT_SHARD.._Items.MagParam12  is not null  then (select convert(int, cast(SUBSTRING(CONVERT(VARBINARY(5), cast((MagParam12 ) as bigint)),1,1) as varbinary)) )   end VBlue12  \
from SRO_VT_SHARD.._Items left join  \
SRO_VT_SHARD.._RefObjCommon on  SRO_VT_SHARD.._Items.RefItemID = SRO_VT_SHARD.._RefObjCommon.ID LEFT JOIN  \
SRO_VT_SHARD..C_EquipStrings on  SRO_VT_SHARD..C_EquipStrings.NameStrID128 = SRO_VT_SHARD.._RefObjCommon.NameStrID128 LEFT JOIN  \
SRO_VT_SHARD.._RefObjItem on  SRO_VT_SHARD.._RefObjItem.ID = SRO_VT_SHARD.._RefObjCommon.Link LEFT JOIN  \
SRO_APK_ONE..RefNameitem on SRO_VT_SHARD.._RefObjCommon.NameStrID128 = SRO_APK_ONE..RefNameitem.refname left join  \
SRO_VT_SHARD.._Inventory on SRO_VT_SHARD.._Items.ID64 = sro_vt_shard.._Inventory.ItemID left join  \
SRO_VT_SHARD.._User on SRO_VT_SHARD.._Inventory.CharID = SRO_VT_SHARD.._User.CharID left join  \
SRO_VT_SHARD.._BindingOptionWithItem on SRO_VT_SHARD.._Items.ID64 = SRO_VT_SHARD.._BindingOptionWithItem.nItemDBID AND SRO_VT_SHARD.._BindingOptionWithItem.bOptType = 2  \
where SRO_VT_SHARD.._Items.ID64 = @Item"


const serverevent ="SELECT * FROM [SRO_VT_LOG].[dbo].[_Evento_Server] where On_Off like 'On' "
const cantsilk ="declare @silk int = (select silk_own from SRO_VT_ACCOUNT..SK_Silk where JID = (select JID from SRO_VT_ACCOUNT..TB_User where StrUserID like @user  ))\
if (@silk is null) select 0 as silk_own else select @silk as silk_own" 


export const querrys = {
  fortres ,
  uniqstatus,
  rjob,
  download,
  guildmember,
  datosplayer,
  uniqlogplayer,
  userexiste,
  registro,
  uniqmapmob,
  inventarioavatar,
  infoitem,
  serverevent,
  cantplateronline,
  cantsilk,
};
