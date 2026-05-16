[Setup]
AppName=AGZ Pro
AppVersion=1.0.0 Enterprise
AppPublisher=Quantum Tech Inc.
AppCopyright=Copyright (C) 2026 Quantum Tech
AppSupportURL=https://agzpro.com
WizardStyle=modern

; Icono del instalador
SetupIconFile=logo.ico

; Directorios
DefaultDirName={autopf}\AGZ Pro
DefaultGroupName=AGZ Pro
UninstallDisplayIcon={app}\agz_pro.exe
UninstallDisplayName=AGZ Pro Enterprise

; Compresión y salida
Compression=lzma2/ultra
SolidCompression=yes
OutputDir=.\Instalador_Final
OutputBaseFilename=AGZ_Pro_Setup_v1.0

; Compatibilidad 64-bit
ArchitecturesInstallIn64BitMode=x64compatible

; Permisos (admin con posibilidad de bajar a usuario)
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

[Tasks]
Name: "desktopicon"; Description: "Crear un acceso directo en el Escritorio"; GroupDescription: "Iconos adicionales:"
Name: "contextmenu"; Description: "Integrar AGZ Pro en el Menú Contextual de Windows (Clic Derecho)"; GroupDescription: "Integración de Sistema:"

[Files]
; Binarios críticos
Source: "agz_pro.exe";       DestDir: "{app}"; Flags: ignoreversion
Source: "sfx_stub.exe";      DestDir: "{app}"; Flags: ignoreversion
Source: "agz_extractor.exe"; DestDir: "{app}"; Flags: ignoreversion

; Assets de branding (necesarios para la UI)
Source: "logo.ico";          DestDir: "{app}"; Flags: ignoreversion
Source: "logo_small.bmp";    DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\AGZ Pro";             Filename: "{app}\agz_pro.exe"; IconFilename: "{app}\logo.ico"
Name: "{group}\Desinstalar AGZ Pro"; Filename: "{uninstallexe}"
Name: "{autodesktop}\AGZ Pro";       Filename: "{app}\agz_pro.exe"; IconFilename: "{app}\logo.ico"; Tasks: desktopicon

[Registry]
; Asociación de extensión .agz
Root: HKCR; Subkey: ".agz";                              ValueType: string; ValueName: ""; ValueData: "AGZArchive";                   Flags: uninsdeletevalue
Root: HKCR; Subkey: "AGZArchive";                        ValueType: string; ValueName: ""; ValueData: "Archivo Comprimido AGZ Pro";   Flags: uninsdeletekey
Root: HKCR; Subkey: "AGZArchive\DefaultIcon";            ValueType: string; ValueName: ""; ValueData: "{app}\agz_pro.exe,0"
Root: HKCR; Subkey: "AGZArchive\shell\open\command";     ValueType: string; ValueName: ""; ValueData: """{app}\agz_pro.exe"" ""%1"""

; Menú contextual en archivos (clic derecho)
Root: HKA; Subkey: "Software\Classes\*\shell\AGZPro";           ValueType: string; ValueName: "MUIVerb"; ValueData: "⚡ Comprimir con AGZ Pro"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKA; Subkey: "Software\Classes\*\shell\AGZPro";           ValueType: string; ValueName: "Icon";    ValueData: "{app}\agz_pro.exe";         Tasks: contextmenu
Root: HKA; Subkey: "Software\Classes\*\shell\AGZPro\command";   ValueType: string; ValueName: ""; ValueData: """{app}\agz_pro.exe"" ""%1""";     Tasks: contextmenu

; Menú contextual en carpetas (clic derecho)
Root: HKA; Subkey: "Software\Classes\Directory\shell\AGZPro";          ValueType: string; ValueName: "MUIVerb"; ValueData: "⚡ Comprimir con AGZ Pro"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKA; Subkey: "Software\Classes\Directory\shell\AGZPro";          ValueType: string; ValueName: "Icon";    ValueData: "{app}\agz_pro.exe";         Tasks: contextmenu
Root: HKA; Subkey: "Software\Classes\Directory\shell\AGZPro\command";  ValueType: string; ValueName: ""; ValueData: """{app}\agz_pro.exe"" ""%1""";     Tasks: contextmenu

[Run]
Filename: "{app}\agz_pro.exe"; Description: "Ejecutar AGZ Pro (Enterprise Edition)"; Flags: nowait postinstall skipifsilent
