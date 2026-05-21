const datoscuenta = `declare  @charname Varchar(max),  @userid varchar(max)


set @charname =@Char
set @userid = @ID


if @userid != ''
	begin
		SELECT SRO_VT_SHARD.._Char.CharID, StrUserID,CharName16, parola, silk_own, CurLevel,LastLogout
		FROM [SRO_VT_ACCOUNT].[dbo].[SK_Silk] join SRO_VT_SHARD.._User on SRO_VT_SHARD.._User.UserJID = SRO_VT_ACCOUNT..SK_Silk.JID
										join SRO_VT_ACCOUNT..TB_User on SRO_VT_SHARD.._User.UserJID = SRO_VT_ACCOUNT..TB_User.JID
										join SRO_VT_SHARD.._Char on SRO_VT_SHARD.._Char.CharID = SRO_VT_SHARD.._User.CharID
										where StrUserID like @userid   order By StrUserID, CharName16
		end
else if @charname != ''
	begin
		SELECT SRO_VT_SHARD.._Char.CharID, StrUserID,CharName16, parola, silk_own, CurLevel,LastLogout
		FROM [SRO_VT_ACCOUNT].[dbo].[SK_Silk] join SRO_VT_SHARD.._User on SRO_VT_SHARD.._User.UserJID = SRO_VT_ACCOUNT..SK_Silk.JID
										join SRO_VT_ACCOUNT..TB_User on SRO_VT_SHARD.._User.UserJID = SRO_VT_ACCOUNT..TB_User.JID
										join SRO_VT_SHARD.._Char on SRO_VT_SHARD.._Char.CharID = SRO_VT_SHARD.._User.CharID
										where  CharName16 like @charname order By StrUserID, CharName16
	end
else 
	begin
		print 'Coloque ID o Charname'
	end
  `;
export const querrys2 = {datoscuenta};
