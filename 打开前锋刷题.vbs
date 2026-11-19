Option Explicit
Dim fso, sh, root, ps1, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = fso.BuildPath(root, "server.ps1")
If Not fso.FileExists(ps1) Then
  MsgBox "找不到 server.ps1。" & vbCrLf & "请把整个文件夹放在一起，再双击打开。", 48, "前锋刷题软件"
  WScript.Quit 1
End If
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """"
sh.Run cmd, 0, False
