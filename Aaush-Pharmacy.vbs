Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

cmd = "powershell.exe -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File """ & strPath & "\silent-launch.ps1"""
WshShell.Run cmd, 0, False
Set WshShell = Nothing
Set fso = Nothing
