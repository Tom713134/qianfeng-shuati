Option Explicit
Dim fso, sh, root, ps1, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = fso.BuildPath(root, "server.ps1")
If Not fso.FileExists(ps1) Then
  MsgBox "Cannot find server.ps1." & vbCrLf & "Keep the whole folder together, then open again.", 48, "Qianfeng Shuati"
  WScript.Quit 1
End If
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """"
sh.Run cmd, 0, False
