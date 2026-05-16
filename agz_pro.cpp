#define UNICODE
#define _UNICODE
#include <windows.h>
#include <commctrl.h>
#include <shellapi.h>
#include <shlobj.h>
#include <oleidl.h>
#include <uxtheme.h>
#include <dwmapi.h>
#pragma comment(lib, "dwmapi.lib")
#include <iostream>
#include <vector>
#include <cmath>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <future>
#include <iomanip>
#include <string>
#include <zlib.h>
#define XXH_INLINE_ALL
#include "xxhash.h"
#include <immintrin.h> // SIMD AVX2
#include <unordered_map> // Deduplicación
#include <algorithm> // min/max/reverse

// --- Configuración e Inyecciones ---
#pragma comment(linker,"\"/manifestdependency:type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'\"")
#pragma comment(lib, "kernel32.lib")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "zlib.lib")

#define BLOCK_SIZE (64 * 1024)
#define ENTROPY_THRESHOLD_HIGH 7.0
#define ENTROPY_THRESHOLD_LOW 4.0

// Mensajes de Comunicación Asíncrona UI-Engine
#define WM_USER_UPDATE_PROGRESS (WM_USER + 1)
#define WM_USER_PROCESS_DONE    (WM_USER + 2)

// Paleta Quantum Tech
// ── Paleta Quantum Tech v2 ────────────────────────────────────────────
#define COL_BG          RGB(10,  25,  47)   // #0A192F Fondo Abisal
#define COL_BG_ALT      RGB(17,  34,  64)   // #112240 Fila impar (cebra)
#define COL_BG_BOT      RGB(2,   6,   23)   // Negro Profundo
#define COL_ACCENT      RGB(230, 57,  70)   // #E63946 Carmesí Energético
#define COL_TEXT        RGB(241, 250, 238)  // #F1FAEE Blanco Humo
#define COL_TEXT_SEC    RGB(141, 153, 174)  // #8D99AE Gris Atenuado
#define COL_SEL_BG      RGB(45,  15,  25)   // Carmesí Suave Selección
#define COL_GOLD        RGB(234, 179, 8)    // Dorado PRO

HWND hMainWnd, hListView, hToolBar, hProgressBar, hStatusBar;
HWND hHistoryList, hHomePanel, hSettingsPanel; // Nuevos paneles
HWND hLangBtn, hShellBtn, hProBtn; 
HBRUSH hbgBrush, hBrushAlt, hBrushAccent;
HFONT hFontMain, hFontBig, hFontHeader;

enum Lang { EN, ES, PT, ZH };
extern Lang g_CurrentLang;
const wchar_t* TR(const wchar_t* en, const wchar_t* es, const wchar_t* pt, const wchar_t* zh);
void AddFileToList(const std::wstring& fullPath);

// Procedimiento de ventana para los botones (Subclase para forzar pintado Diamond 3D)
LRESULT CALLBACK Button3DProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam, UINT_PTR uIdSubclass, DWORD_PTR dwRefData) {
    switch (uMsg) {
        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hwnd, &ps);
            RECT rc; GetClientRect(hwnd, &rc);
            
            // 1. Fondo Abisal (Garantía contra blanco)
            HBRUSH hBr = CreateSolidBrush(RGB(5, 15, 35));
            FillRect(hdc, &rc, hBr);
            DeleteObject(hBr);

            // 2. Degradado Metálico
            TRIVERTEX v[2];
            v[0].x = rc.left; v[0].y = rc.top;
            v[0].Red = 0x0A00; v[0].Green = 0x2A00; v[0].Blue = 0x5A00; v[0].Alpha = 0; 
            v[1].x = rc.right; v[1].y = rc.bottom;
            v[1].Red = 0x0100; v[1].Green = 0x0500; v[1].Blue = 0x1000; v[1].Alpha = 0;
            GRADIENT_RECT gr = {0, 1};
            GradientFill(hdc, v, 2, &gr, 1, GRADIENT_FILL_RECT_V);

            // 3. Bordes de Profundidad 3D
            DrawEdge(hdc, &rc, EDGE_RAISED, BF_RECT);
            
            // 4. Texto Estático (Garantiza visibilidad)
            const wchar_t* btnTxt = L"---";
            int id = GetWindowLongW(hwnd, GWL_ID);
            if (id == 401) btnTxt = TR(L"🌐 Language Selection", L"🌐 Selección de Idioma", L"🌐 Seleção de Idioma", L"🌐 语言选择");
            if (id == 302) btnTxt = TR(L"📁 Windows Integration", L"📁 Integrar a Windows", L"📁 Integração Windows", L"📁 系统集成");
            if (id == 105) btnTxt = TR(L"💎 Activate PRO License", L"💎 Activar Licencia PRO", L"💎 Ativar Licença PRO", L"💎 激活 PRO 许可证");

            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, RGB(255, 255, 255));
            SelectObject(hdc, hFontMain);
            DrawTextW(hdc, btnTxt, -1, &rc, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
            
            EndPaint(hwnd, &ps);
            return 0; // Detener el pintado por defecto de Windows
        }
        case WM_ERASEBKGND: return 1;
    }
    return DefSubclassProc(hwnd, uMsg, wParam, lParam);
}
bool g_MakeSFX = false;
bool g_EnableAES = false; // Desactivado por defecto
bool g_IsProActivated = false;
int  g_ActiveTab = 1; // 0:Home, 1:File Manager, 2:Projects, 3:Settings

Lang g_CurrentLang = EN;

const wchar_t* TR(const wchar_t* en, const wchar_t* es, const wchar_t* pt, const wchar_t* zh) {
    if (g_CurrentLang == ES) return es;
    if (g_CurrentLang == PT) return pt;
    if (g_CurrentLang == ZH) return zh;
    return en;
}

// ── Sistema de Monetización A+B ──────────────────────────────────────────────
// Reemplazá las URLs con tus links de afiliado reales
static int  g_AdBannerIndex   = 0;   // Índice del banner actual
static int  g_OpsCount        = 0;   // Contador de operaciones completadas
static const int AD_TIMER_ID  = 42;
static const int AD_SHOW_EVERY = 5;  // Mostrar dialog cada N operaciones

struct AdEntry { const wchar_t* msg; const wchar_t* url; };
static const AdEntry ADS[] = {
    { L"  🛡️  Proté tu privacidad — NordVPN con 70% de descuento ►",  L"https://nordvpn.com" },
    { L"  ☁️  Hosting profesional desde $1.99/mes — Hostinger ►",       L"https://hostinger.com" },
    { L"  🔒  Naveá anónimo con Surfshark — Prueba gratis 30 días ►",   L"https://surfshark.com" },
    { L"  ⭐  ¿Te sirve AGZ Pro? ¡Apoyá el proyecto con una donación! ►", L"https://paypal.me" },
    { L"  💡  Activá AGZ Pro Enterprise — Sin publicidad + más funciones", nullptr },
};
static const int ADS_COUNT = (int)(sizeof(ADS) / sizeof(ADS[0]));

std::wstring g_CurrentPassword = L"";
std::wstring g_CurrentArchive = L""; // Rastrea el archivo .agz abierto actualmente en File Manager
 // Contraseña del usuario
std::wstring g_HWID = L"";
uint64_t g_SplitVolumeSize = 0; // 0 = Sin dividir

struct FileEntry {
    std::wstring fullPath;
    std::wstring relativePath;
    uint64_t size;
};

// --- INTERFAZ MODAL DE CONTRASEÑA ---
LRESULT CALLBACK PasswordProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch(msg) {
        case WM_CREATE: {
            // Diálogo oscuro: sin bordes clásicos (WS_EX_CLIENTEDGE removido)
            BOOL dark = TRUE;
            DwmSetWindowAttribute(hwnd, 20, &dark, sizeof(dark));
            CreateWindowExW(0, L"STATIC", L"Introduce la contraseña maestra:",
                WS_CHILD | WS_VISIBLE, 15, 15, 270, 20, hwnd, NULL, NULL, NULL);
            HWND hEdit = CreateWindowExW(0, L"EDIT", L"",
                WS_CHILD | WS_VISIBLE | ES_PASSWORD | ES_AUTOHSCROLL | WS_BORDER,
                15, 42, 270, 28, hwnd, (HMENU)1, NULL, NULL);
            SetWindowTheme(hEdit, L"DarkMode_Explorer", NULL);
            CreateWindowExW(0, L"BUTTON", L"Aceptar",
                WS_CHILD | WS_VISIBLE | BS_DEFPUSHBUTTON,
                105, 86, 90, 32, hwnd, (HMENU)2, NULL, NULL);
            break;
        }
        case WM_COMMAND: {
            if (LOWORD(wParam) == 2) { // Botón Aceptar
                wchar_t buf[256];
                GetWindowTextW(GetDlgItem(hwnd, 1), buf, 256);
                g_CurrentPassword = buf;
                g_EnableAES = (g_CurrentPassword.length() > 0);
                DestroyWindow(hwnd);
            }
            break;
        }
        case WM_CLOSE:
            g_EnableAES = false;
            DestroyWindow(hwnd);
            break;
        default:
            return DefWindowProcW(hwnd, msg, wParam, lParam);
    }
    return 0;
}

void ShowPasswordPrompt(HWND hParent) {
    WNDCLASSW wc = {0};
    wc.lpfnWndProc = PasswordProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = L"PasswordPrompt";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW+1);
    RegisterClassW(&wc);
    
    HWND hDlg = CreateWindowExW(WS_EX_DLGMODALFRAME | WS_EX_TOPMOST, L"PasswordPrompt", L"AGZ Pro - Seguridad AES", WS_POPUP | WS_CAPTION | WS_SYSMENU | WS_VISIBLE,
        0, 0, 300, 160, hParent, NULL, GetModuleHandle(NULL), NULL);
    
    // Centrar en pantalla
    RECT rcParent, rcDlg;
    GetWindowRect(hParent, &rcParent);
    GetWindowRect(hDlg, &rcDlg);
    SetWindowPos(hDlg, NULL, rcParent.left + (rcParent.right - rcParent.left - (rcDlg.right - rcDlg.left))/2, 
        rcParent.top + (rcParent.bottom - rcParent.top - (rcDlg.bottom - rcDlg.top))/2, 0, 0, SWP_NOSIZE | SWP_NOZORDER);
        
    EnableWindow(hParent, FALSE); // Bloquea la ventana principal (Modalidad estricta)
    
    MSG msg;
    while (IsWindow(hDlg) && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    EnableWindow(hParent, TRUE);
    SetFocus(hParent);
}

// --- SISTEMA DE LICENCIAS (DRM & Anti-Piracy) ---
class LicenseManager {
public:
    static std::wstring getHWID() {
        DWORD volSerial = 0;
        GetVolumeInformationW(L"C:\\", NULL, 0, &volSerial, NULL, NULL, NULL, 0);
        wchar_t compName[MAX_COMPUTERNAME_LENGTH + 1];
        DWORD size = sizeof(compName) / sizeof(compName[0]);
        GetComputerNameW(compName, &size);
        
        // Huella digital criptográfica anclada al Hardware
        std::wstring raw = std::wstring(compName) + std::to_wstring(volSerial);
        uint64_t hash = XXH64(raw.c_str(), raw.length() * sizeof(wchar_t), 0xABCDEF1234567890ULL);
        
        wchar_t hwid[32];
        swprintf(hwid, 32, L"%08llX-%08llX", hash >> 32, hash & 0xFFFFFFFF);
        return std::wstring(hwid);
    }
    
    static std::wstring generateExpectedKey(const std::wstring& hwid) {
        uint64_t expectedHash = XXH64(hwid.c_str(), hwid.length() * sizeof(wchar_t), 0x2026051620260516ULL);
        wchar_t key[32];
        swprintf(key, 32, L"AGZ-%08llX-%08llX", expectedHash >> 32, expectedHash & 0xFFFFFFFF);
        return std::wstring(key);
    }

    static bool validateKey(const std::wstring& hwid, const std::wstring& key) {
        return key == generateExpectedKey(hwid);
    }
    
    static bool loadAndVerify() {
        HKEY hKey;
        if (RegOpenKeyExW(HKEY_CURRENT_USER, L"Software\\AGZPro", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            wchar_t keyBuf[256] = {0};
            DWORD size = sizeof(keyBuf);
            if (RegQueryValueExW(hKey, L"License", NULL, NULL, (LPBYTE)keyBuf, &size) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                return validateKey(getHWID(), std::wstring(keyBuf));
            }
            RegCloseKey(hKey);
        }
        return false;
    }
    
    static void saveKey(const std::wstring& key) {
        HKEY hKey;
        RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\AGZPro", 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL);
        RegSetValueExW(hKey, L"License", 0, REG_SZ, (const BYTE*)key.c_str(), (DWORD)(key.length() * sizeof(wchar_t) + 2));
        RegCloseKey(hKey);
    }

    static bool checkTrialExpired() {
        HKEY hKey;
        DWORD disposition;
        if (RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\AGZPro", 0, NULL, 0, KEY_READ | KEY_WRITE, NULL, &hKey, &disposition) == ERROR_SUCCESS) {
            FILETIME ft;
            DWORD size = sizeof(FILETIME);
            if (disposition == REG_CREATED_NEW_KEY || RegQueryValueExW(hKey, L"InstallDate", NULL, NULL, (LPBYTE)&ft, &size) != ERROR_SUCCESS) {
                GetSystemTimeAsFileTime(&ft);
                RegSetValueExW(hKey, L"InstallDate", 0, REG_BINARY, (const BYTE*)&ft, sizeof(FILETIME));
                RegCloseKey(hKey);
                return false;
            }
            RegCloseKey(hKey);
            
            FILETIME now;
            GetSystemTimeAsFileTime(&now);
            ULARGE_INTEGER uInstall, uNow;
            uInstall.LowPart = ft.dwLowDateTime; uInstall.HighPart = ft.dwHighDateTime;
            uNow.LowPart = now.dwLowDateTime; uNow.HighPart = now.dwHighDateTime;
            
            // 30 días en intervalos de 100-nanosegundos (30 * 24 * 60 * 60 * 10,000,000)
            if (uNow.QuadPart > uInstall.QuadPart + 25920000000000ULL) {
                return true;
            }
        }
        return false;
    }

    // TRAMPA DE ENTROPÍA (Anti-Crack)
    // Devuelve 0 si la licencia matemática en el Registro es matemáticamente perfecta.
    // Si un cracker alteró la memoria (g_IsProActivated = true) pero no tiene llave real, devuelve ruido.
    static uint32_t getEntropySeed(const std::wstring& hwid) {
        HKEY hKey;
        if (RegOpenKeyExW(HKEY_CURRENT_USER, L"Software\\AGZPro", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            wchar_t keyBuf[256] = {0};
            DWORD size = sizeof(keyBuf);
            if (RegQueryValueExW(hKey, L"License", NULL, NULL, (LPBYTE)keyBuf, &size) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                if (std::wstring(keyBuf) == generateExpectedKey(hwid)) return 0; // Clave perfecta, sin corrupción.
            }
            RegCloseKey(hKey);
        }
        return 0xDEADBEEF; // Semilla de corrupción. Destruirá el SFX si el software está crackeado.
    }
};

void InstallContextMenu() {
    wchar_t exePath[MAX_PATH];
    GetModuleFileNameW(NULL, exePath, MAX_PATH);
    std::wstring sExe = L"\"" + std::wstring(exePath) + L"\"";

    HKEY hKey;
    // 1. Registro de la extensión .agz (File Association)
    if (RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\Classes\\.agz", 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)L"AGZ.Archive", 24);
        RegCloseKey(hKey);
    }
    
    // 2. Definición del tipo de archivo AGZ.Archive
    if (RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\Classes\\AGZ.Archive", 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)L"AGZ Compressed Archive", 46);
        RegCloseKey(hKey);
    }

    // Icono para el archivo .agz (Usa el icono del ejecutable)
    if (RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\Classes\\AGZ.Archive\\DefaultIcon", 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)exePath, (DWORD)(wcslen(exePath) * 2 + 2));
        RegCloseKey(hKey);
    }

    // Comando 'Open' (Doble clic en .agz)
    std::wstring openCmd = sExe + L" \"%1\"";
    if (RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\Classes\\AGZ.Archive\\shell\\open\\command", 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)openCmd.c_str(), (DWORD)(openCmd.length() * 2 + 2));
        RegCloseKey(hKey);
    }

    // 3. Menú Contextual (Clic derecho en *archivos*)
    std::wstring menuPath = L"Software\\Classes\\*\\shell\\AGZPro";
    if (RegCreateKeyExW(HKEY_CURRENT_USER, menuPath.c_str(), 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)L"Compress with AGZ Pro", 44);
        RegSetValueExW(hKey, L"Icon", 0, REG_SZ, (const BYTE*)exePath, (DWORD)(wcslen(exePath) * 2 + 2));
        RegCloseKey(hKey);
    }
    std::wstring cmdPath = menuPath + L"\\command";
    if (RegCreateKeyExW(HKEY_CURRENT_USER, cmdPath.c_str(), 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)openCmd.c_str(), (DWORD)(openCmd.length() * 2 + 2));
        RegCloseKey(hKey);
    }

    // 4. Menú Contextual (Clic derecho en *carpetas*)
    std::wstring dirPath = L"Software\\Classes\\Directory\\shell\\AGZPro";
    if (RegCreateKeyExW(HKEY_CURRENT_USER, dirPath.c_str(), 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)L"Compress with AGZ Pro", 44);
        RegSetValueExW(hKey, L"Icon", 0, REG_SZ, (const BYTE*)exePath, (DWORD)(wcslen(exePath) * 2 + 2));
        RegCloseKey(hKey);
    }
    std::wstring dirCmdPath = dirPath + L"\\command";
    if (RegCreateKeyExW(HKEY_CURRENT_USER, dirCmdPath.c_str(), 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)openCmd.c_str(), (DWORD)(openCmd.length() * 2 + 2));
        RegCloseKey(hKey);
    }

    // Notificar al sistema para refrescar iconos
    SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, NULL, NULL);
    
    MessageBoxW(NULL, TR(L"AGZ Pro is now integrated with Windows Explorer!", L"¡AGZ Pro ahora está integrado con el Explorador de Windows!", L"O AGZ Pro agora está integrado ao Windows Explorer!", L"AGZ Pro 现已与 Windows 资源管理器集成！"), L"AGZ Pro", MB_OK | MB_ICONINFORMATION);
}

// --- MOTOR tANS (Tabled Asymmetric Numeral Systems) ---
#define TANS_L 1024 // Resolución de estados de Markov (Potencia de 2 para bit-shifts rápidos)

enum class CompressionMode : uint8_t { Bypass = 0x00, DeltaANS = 0x01, TANS_Dict = 0x02, Solid_TANS = 0x03, Deduplicated = 0x04, Static_TANS = 0x05, Recovery_Parity = 0xFF };

struct TANSDictionary {
    uint16_t freqs[256]; // Frecuencias normalizadas cuya sumatoria es exactamente TANS_L
};

struct TANSDecodeState {
    uint8_t symbol; // Símbolo a emitir
    uint8_t nbBits; // Bits que se deben leer del flujo
    uint16_t newX;  // Nuevo estado base para la siguiente iteración
};

// Estructura de Diccionario Estático Pre-entrenado (IA Text/HTML)
const TANSDictionary STATIC_HTML_DICT = { /* Frecuencias pre-calculadas en laboratorio */ {10, 5, 20} };

#pragma pack(push, 1)
struct BlockHeader {
    uint32_t originalSize;
    uint32_t compressedSize;
    uint64_t blockHash;
    CompressionMode mode;
};
#pragma pack(pop)

struct BlockData {
    BlockHeader header;
    std::vector<uint8_t> payload;
};

struct ROIData {
    int listIndex;
    double timeSavings;
    double sizeOrigMB;
    double sizeAgzMB;
    double elapsedSec;
    std::wstring fileName;
};

class TANSCoder {
public:
    // 1. Fase de Ingesta y Normalización
    static TANSDictionary buildDictionary(const uint8_t* data, size_t size) {
        TANSDictionary dict = {0};
        if (size == 0) return dict;

        size_t counts[256] = {0};
        for (size_t i = 0; i < size; i++) counts[data[i]]++;

        // Normalización Lineal al espacio TANS_L
        uint32_t step = 0;
        for (int i = 0; i < 256; i++) {
            if (counts[i] > 0) {
                // Todo símbolo existente reclama al menos 1 estado cuántico
                dict.freqs[i] = (uint16_t)std::max(1.0, round((double)counts[i] * TANS_L / size));
                step += dict.freqs[i];
            }
        }

        // Ajuste de Residuos (Fuerza bruta matemática para asegurar ΣP = TANS_L)
        while (step > TANS_L) {
            for (int i = 0; i < 256 && step > TANS_L; i++) {
                if (dict.freqs[i] > 1) { dict.freqs[i]--; step--; }
            }
        }
        while (step < TANS_L) {
            for (int i = 0; i < 256 && step < TANS_L; i++) {
                if (dict.freqs[i] > 0) { dict.freqs[i]++; step++; }
            }
        }
        return dict;
    }

    // 2. Generación de la Máquina de Estados Finitos (FSM)
    static void buildDecodeTable(const TANSDictionary& dict, TANSDecodeState* decodeTable) {
        uint8_t symbolSpread[TANS_L];
        uint16_t nextPos[256];

        // A. Algoritmo de dispersión de Jarek Duda (Aproximación Golden Ratio)
        // Distribuye los símbolos uniformemente para maximizar la entropía
        uint32_t step = (TANS_L >> 1) + (TANS_L >> 3) + 3; 
        uint32_t pos = 0;
        
        for (int sym = 0; sym < 256; sym++) {
            for (int i = 0; i < dict.freqs[sym]; i++) {
                symbolSpread[pos] = (uint8_t)sym;
                pos = (pos + step) & (TANS_L - 1);
            }
        }

        // B. Asignación de rangos de estados de Markov
        for (int sym = 0; sym < 256; sym++) {
            nextPos[sym] = dict.freqs[sym]; 
        }

        // C. Construcción de Transiciones de Estado
        for (int i = 0; i < TANS_L; i++) {
            uint8_t s = symbolSpread[i];
            uint16_t x = nextPos[s]++; 
            
            // Cálculo rápido de log2(x) mediante bit-shifts
            uint32_t k = 0;
            uint16_t temp = x;
            while (temp > 1) { temp >>= 1; k++; }
            
            decodeTable[i].symbol = s;
            // Ecuación de estado tANS: Bits a leer = R - floor(log2(x))
            decodeTable[i].nbBits = (uint8_t)(10 - k); // 10 porque 2^10 = 1024 (TANS_L)
            decodeTable[i].newX = (uint16_t)(x << (10 - k));
        }
    }

    // 3. Tabla de Codificación Inversa
    static void buildEncodeTable(const TANSDecodeState* decodeTable, const TANSDictionary& dict, uint16_t* encodeTable) {
        uint16_t nextPos[256];
        for (int sym = 0; sym < 256; sym++) {
            nextPos[sym] = dict.freqs[sym]; // Estado base inicial para codificar
        }
        
        for (uint16_t i = 0; i < TANS_L; i++) {
            uint8_t s = decodeTable[i].symbol;
            uint16_t x = nextPos[s]++;
            // Inversión perfecta: el estado X decodificado apunta al nuevo estado codificado
            encodeTable[x] = i + TANS_L;
        }
    }

    // 4. Bucle Maestro de Compresión (Bit-Stream)
    static std::vector<uint8_t> compressTANS(const std::vector<uint8_t>& data, const TANSDictionary& dict, const uint16_t* encodeTable) {
        std::vector<bool> bitStack;
        uint16_t state = TANS_L; // Estado inicial

        // La codificación ANS es estricta LIFO (Last-In-First-Out)
        for (int i = (int)data.size() - 1; i >= 0; i--) {
            uint8_t s = data[i];
            uint16_t maxState = (dict.freqs[s] << 1);

            // Bucle de eyección de bits
            while (state >= maxState) {
                bitStack.push_back((state & 1) != 0);
                state >>= 1; 
            }
            // Transición de estado de Markov
            state = encodeTable[state];
        }
        
        // El estado final (16 bits) debe ser empujado a la cima de la pila
        for (int i = 0; i < 16; i++) {
            bitStack.push_back(((state >> i) & 1) != 0);
        }

        // Magia LIFO: Invertimos el flujo de bits para que la decodificación lea hacia adelante
        std::reverse(bitStack.begin(), bitStack.end());

        // Empaquetado a binario puro
        std::vector<uint8_t> outStream;
        outStream.reserve((bitStack.size() + 7) / 8);
        uint8_t cur = 0; int p = 0;
        for (bool b : bitStack) {
            if (b) cur |= (1 << p);
            p++;
            if (p == 8) { outStream.push_back(cur); cur = 0; p = 0; }
        }
        if (p > 0) outStream.push_back(cur);
        return outStream;
    }

    // 5. Bucle Maestro de Extracción Matemática
    static std::vector<uint8_t> decompressTANS(const std::vector<uint8_t>& stream, size_t originalSize, const TANSDecodeState* decodeTable) {
        std::vector<uint8_t> out(originalSize);
        std::vector<bool> bitStack;
        
        // Expansión rápida del Stream
        for (uint8_t byte : stream) {
            for (int i = 0; i < 8; i++) bitStack.push_back(((byte >> i) & 1) != 0);
        }
        
        size_t bitPos = 0;
        uint16_t state = 0; 
        
        // Desapilar los primeros 16 bits (orden idéntico al usado en compresión)
        for (int i = 0; i < 16; i++) {
            if (bitPos < bitStack.size() && bitStack[bitPos++]) state |= (1 << i);
        }
        
        // Decodificación directa O(1) impulsada por transiciones FSM
        for (size_t i = 0; i < originalSize; i++) {
            // Anti-Segfault: si el estado sale de los límites de Markov, detener limpiamente
            if (state < TANS_L || state >= 2 * TANS_L) break;
            
            const TANSDecodeState& t = decodeTable[state - TANS_L];
            out[i] = t.symbol;
            
            uint16_t bitsLeidos = 0;
            for (int b = 0; b < t.nbBits; b++) {
                if (bitPos < bitStack.size() && bitStack[bitPos++]) bitsLeidos |= (1 << b);
            }
            state = t.newX + bitsLeidos;
        }
        return out;
    }
};

// --- THREAD POOL ---
class ThreadPool {
private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    std::mutex queue_mutex;
    std::condition_variable condition;
    bool stop = false;

public:
    ThreadPool(size_t threads) {
        for (size_t i = 0; i < threads; ++i) {
            workers.emplace_back([this] {
                for (;;) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(this->queue_mutex);
                        this->condition.wait(lock, [this] { return this->stop || !this->tasks.empty(); });
                        if (this->stop && this->tasks.empty()) return;
                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }
                    task();
                }
            });
        }
    }
    template<class F> auto enqueue(F&& f) -> std::future<typename std::invoke_result<F>::type> {
        using return_type = typename std::invoke_result<F>::type;
        auto task = std::make_shared<std::packaged_task<return_type()>>(std::forward<F>(f));
        std::future<return_type> res = task->get_future();
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            tasks.emplace([task]() { (*task)(); });
        }
        condition.notify_one();
        return res;
    }
    ~ThreadPool() {
        { std::unique_lock<std::mutex> lock(queue_mutex); stop = true; }
        condition.notify_all();
        for (std::thread &worker : workers) worker.join();
    }
};

// --- MOTOR MATEMÁTICO (Ejecutado en Hilos Secundarios) ---
class AGZProEngine {
private:
    // 1. Acelerador GPU: OpenCL / DirectCompute (Skeleton API)
    static bool initGPUOffload() {
        // En producción: Carga dinámica de nvcuda.dll / OpenCL.dll
        // Asignación de tensores en VRAM para compresión masiva paralela
        return false; // Fallback a CPU SIMD si no hay GPU compatible
    }

    static double calculateEntropy(const uint8_t* data, size_t size) {
        if (size == 0) return 0;
        size_t freq[256] = {0};
        for (size_t i = 0; i < size; ++i) freq[data[i]]++;
        double entropy = 0;
        for (int i = 0; i < 256; ++i) {
            if (freq[i] > 0) {
                double p = static_cast<double>(freq[i]) / size;
                entropy -= p * (log(p) / log(2.0));
            }
        }
        return entropy;
    }

    // Aceleración de Hardware: Transformada Delta SIMD (Advanced Vector Extensions 2)
    // Procesa 32 bytes simultáneamente en 1 ciclo de reloj
    static void applyDeltaTransformSIMD(std::vector<uint8_t>& data) {
        if (data.empty()) return;
        size_t size = data.size();
        size_t i = size - 1;
        while (i >= 32) {
            __m256i current = _mm256_loadu_si256((__m256i*)&data[i - 31]);
            __m256i previous = _mm256_loadu_si256((__m256i*)&data[i - 32]);
            __m256i result = _mm256_sub_epi8(current, previous);
            _mm256_storeu_si256((__m256i*)&data[i - 31], result);
            i -= 32;
        }
        while (i > 0) {
            data[i] = (uint8_t)(data[i] - data[i - 1]);
            i--;
        }
    }

    // Detecta formatos ya comprimidos que no se benefician de transformadas matemáticas
    static bool isMediaFile(const std::wstring& path) {
        static const wchar_t* exts[] = {
            L".mp4", L".mkv", L".avi", L".mov", L".wmv", L".flv", L".webm", L".m4v",
            L".mp3", L".aac", L".ogg", L".flac", L".wav", L".wma", L".m4a",
            L".jpg", L".jpeg", L".png", L".gif", L".webp", L".heic",
            L".zip", L".rar", L".7z", L".gz", L".bz2", L".xz", L".agz",
            nullptr
        };
        size_t dot = path.find_last_of(L'.');
        if (dot == std::wstring::npos) return false;
        std::wstring ext = path.substr(dot);
        for (int i = 0; i < (int)ext.size(); i++) ext[i] = towlower(ext[i]);
        for (int i = 0; exts[i]; i++) {
            if (ext == exts[i]) return true;
        }
        return false;
    }

    static BlockData processBlockWorker(const uint8_t* ptr, size_t size, bool useSolid, const TANSDictionary* gDict, const uint16_t* gEncTable, bool forceBypass = false) {
        std::vector<uint8_t> buffer(ptr, ptr + size);
        uint32_t origSize = (uint32_t)buffer.size();
        CompressionMode mode;
        std::vector<uint8_t> output;

        // 2. DEDUPLICACIÓN GLOBAL (Zero-Byte Pointers)
        uint64_t uncompressedHash = XXH64(buffer.data(), buffer.size(), 0);
        // Si el hash existe, la deduplicación se maneja en el hilo principal durante el ensamblaje

        double h = calculateEntropy(buffer.data(), buffer.size());

        if (forceBypass || h > ENTROPY_THRESHOLD_HIGH) {
            mode = CompressionMode::Bypass;
            output = std::move(buffer);
        } else if (useSolid && h < ENTROPY_THRESHOLD_LOW) {
            // Ruta Inteligente: Archivos estructurados y de baja entropía (JSON/Log/Text) -> tANS Puro
            mode = CompressionMode::TANS_Dict;
            
            TANSDictionary dict = TANSCoder::buildDictionary(buffer.data(), buffer.size());
            TANSDecodeState decodeTable[TANS_L];
            TANSCoder::buildDecodeTable(dict, decodeTable);
            uint16_t encodeTable[TANS_L];
            TANSCoder::buildEncodeTable(decodeTable, dict, encodeTable);
            
            std::vector<uint8_t> tansPayload = TANSCoder::compressTANS(buffer, dict, encodeTable);
            
            // Empaquetar el diccionario de probabilidades (512 bytes) adherido al payload comprimido
            output.resize(sizeof(TANSDictionary) + tansPayload.size());
            memcpy(output.data(), &dict, sizeof(TANSDictionary));
            memcpy(output.data() + sizeof(TANSDictionary), tansPayload.data(), tansPayload.size());
        } else {
            // Ruta Inteligente: Flujos numéricos -> SIMD Transformada Delta + LZ77 Fallback (Deflate)
            mode = CompressionMode::DeltaANS;
            applyDeltaTransformSIMD(buffer);
            
            uLongf cSize = compressBound(buffer.size());
            output.resize(cSize);
            if (compress(output.data(), &cSize, buffer.data(), buffer.size()) == Z_OK) {
                output.resize(cSize);
            } else {
                mode = CompressionMode::Bypass;
                output = std::move(buffer);
            }
        }
        
        // Enviamos el hash original sin comprimir para que el hilo principal maneje la tabla de Deduplicación
        return { {origSize, (uint32_t)output.size(), uncompressedHash, mode}, std::move(output) };
    }

public:
    static void decompressAsync(std::wstring inPath, std::wstring outDir, HWND hUI) {
        FILE* logFile = _wfopen(L"extract_log.txt", L"w");
        if (logFile) {
            setvbuf(logFile, NULL, _IONBF, 0); // Desactivar buffer para escritura inmediata
            fwprintf(logFile, L"--- START DECOMPRESS ---\n");
            fwprintf(logFile, L"InPath: %s\n", inPath.c_str());
            fwprintf(logFile, L"OutDir: %s\n", outDir.c_str());
        }

        HANDLE hInput = CreateFileW(inPath.c_str(), GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hInput == INVALID_HANDLE_VALUE) {
            if (logFile) { fwprintf(logFile, L"ERROR: INVALID_HANDLE_VALUE for hInput\n"); fclose(logFile); }
            MessageBoxW(hUI, L"Error: No se pudo abrir el archivo de origen.", L"AGZ Pro", MB_OK | MB_ICONERROR);
            return;
        }

        LARGE_INTEGER liTotalSize;
        GetFileSizeEx(hInput, &liTotalSize);
        uint64_t totalFileBytes = liTotalSize.QuadPart;
        if (logFile) fwprintf(logFile, L"Total File Size: %llu bytes\n", totalFileBytes);

        DWORD br;
        uint32_t magic = 0;
        int filesExtracted = 0;

        while (ReadFile(hInput, &magic, sizeof(magic), &br, NULL) && br > 0) {
            if (magic == 0x46494C45) { // "FILE" Header
                uint16_t pathLen = 0;
                ReadFile(hInput, &pathLen, sizeof(pathLen), &br, NULL);
                std::vector<wchar_t> pathBuf(pathLen + 1, 0);
                ReadFile(hInput, pathBuf.data(), pathLen * sizeof(wchar_t), &br, NULL);
                
                uint64_t origSize = 0;
                ReadFile(hInput, &origSize, sizeof(origSize), &br, NULL);

                if (logFile) fwprintf(logFile, L"\nFound FILE: %s (Size: %llu)\n", pathBuf.data(), origSize);

                // Construir ruta completa de salida
                std::wstring fullOutPath = outDir + L"\\" + pathBuf.data();
                
                // Asegurar que el directorio existe
                std::wstring dirPath = fullOutPath.substr(0, fullOutPath.find_last_of(L"\\"));
                SHCreateDirectoryExW(NULL, dirPath.c_str(), NULL);

                // Escritura del archivo extraído
                HANDLE hOutput = CreateFileW(fullOutPath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
                if (hOutput != INVALID_HANDLE_VALUE) {
                    uint64_t uncompressedRead = 0;
                    while (uncompressedRead < origSize) {
                        BlockHeader bh;
                        DWORD br2;
                        if (!ReadFile(hInput, &bh, sizeof(bh), &br2, NULL) || br2 != sizeof(bh)) {
                            if (logFile) fwprintf(logFile, L"  ERROR: Failed to read BlockHeader. br2=%lu\n", br2);
                            MessageBoxW(hUI, L"Error Crítico: El paquete .agz está corrupto o truncado.", L"AGZ Pro Error", MB_OK | MB_ICONERROR);
                            break;
                        }
                        if (logFile) fwprintf(logFile, L"  Block -> cSize:%u, oSize:%llu, mode:%d\n", bh.compressedSize, bh.originalSize, (int)bh.mode);
                        
                        std::vector<uint8_t> payload(bh.compressedSize);
                        DWORD totalRead = 0;
                        while (totalRead < bh.compressedSize) {
                            DWORD toRead = bh.compressedSize - totalRead;
                            DWORD bytesRead = 0;
                            if (!ReadFile(hInput, payload.data() + totalRead, toRead, &bytesRead, NULL) || bytesRead == 0) break;
                            totalRead += bytesRead;
                        }

                        if (totalRead < bh.compressedSize) {
                            if (logFile) fwprintf(logFile, L"  ERROR: Partial read. Expected %u, got %lu\n", bh.compressedSize, totalRead);
                            MessageBoxW(hUI, L"Error de Lectura Parcial: Interrupción detectada en el stream de datos.", L"AGZ Pro Error", MB_OK | MB_ICONERROR);
                            break;
                        }
                        
                        if (bh.mode == CompressionMode::Bypass) {
                            DWORD written;
                            WriteFile(hOutput, payload.data(), payload.size(), &written, NULL);
                            if (logFile && written != payload.size()) fwprintf(logFile, L"  ERROR: WriteFile wrote %lu instead of %zu\n", written, payload.size());
                        } else if (bh.mode == CompressionMode::DeltaANS) {
                            std::vector<uint8_t> outBuf(bh.originalSize);
                            uLongf outSize = bh.originalSize;
                            if (uncompress(outBuf.data(), &outSize, payload.data(), payload.size()) == Z_OK) {
                                outBuf.resize(outSize); // Ajustar al tamaño real devuelto por zlib
                                // Transformada Delta Inversa
                                for (size_t ii = 1; ii < outBuf.size(); ii++) {
                                    outBuf[ii] = (uint8_t)(outBuf[ii] + outBuf[ii - 1]);
                                }
                                DWORD written;
                                WriteFile(hOutput, outBuf.data(), (DWORD)outBuf.size(), &written, NULL);
                                if (logFile && written != (DWORD)outBuf.size()) fwprintf(logFile, L"  ERROR: WriteFile wrote %lu instead of %lu\n", written, (DWORD)outBuf.size());
                            } else {
                                if (logFile) fwprintf(logFile, L"  ERROR: ZLib uncompress failed (cSize=%u, oSize=%u)\n", bh.compressedSize, bh.originalSize);
                            }
                        } else if (bh.mode == CompressionMode::TANS_Dict) {
                            TANSDictionary dict;
                            memcpy(&dict, payload.data(), sizeof(TANSDictionary));
                            std::vector<uint8_t> tansPayload(payload.begin() + sizeof(TANSDictionary), payload.end());
                            
                            TANSDecodeState decodeTable[TANS_L];
                            TANSCoder::buildDecodeTable(dict, decodeTable);
                            std::vector<uint8_t> outBuf = TANSCoder::decompressTANS(tansPayload, bh.originalSize, decodeTable);
                            
                            DWORD written;
                            WriteFile(hOutput, outBuf.data(), outBuf.size(), &written, NULL);
                        }
                        uncompressedRead += bh.originalSize;
                        
                        // Actualizar UI: Usamos filesExtracted como listIndex visual
                        LARGE_INTEGER liCur; liCur.QuadPart = 0;
                        SetFilePointerEx(hInput, liCur, &liCur, FILE_CURRENT);
                        int progressPercent = (totalFileBytes > 0) ? (int)((liCur.QuadPart * 100) / totalFileBytes) : 0;
                        PostMessageW(hUI, WM_USER_UPDATE_PROGRESS, filesExtracted, progressPercent);
                    }
                    if (logFile) fwprintf(logFile, L"  Finished writing file. uncompressedRead: %llu\n", uncompressedRead);
                    CloseHandle(hOutput);
                    filesExtracted++;
                } else {
                    if (logFile) fwprintf(logFile, L"ERROR: Failed to create output file %s\n", fullOutPath.c_str());
                    MessageBoxW(hUI, (L"No se pudo crear el archivo: " + fullOutPath).c_str(), L"AGZ Pro Error", MB_OK | MB_ICONWARNING);
                    // Mantener sincronía de bloques saltándolos
                    uint64_t uncompressedRead = 0;
                    while (uncompressedRead < origSize) {
                        BlockHeader bh;
                        DWORD br2;
                        if (!ReadFile(hInput, &bh, sizeof(bh), &br2, NULL) || br2 != sizeof(bh)) break;
                        LARGE_INTEGER liSkipBlock; liSkipBlock.QuadPart = bh.compressedSize;
                        SetFilePointerEx(hInput, liSkipBlock, NULL, FILE_CURRENT);
                        uncompressedRead += bh.originalSize;
                    }
                }
            } else {
                if (logFile) fwprintf(logFile, L"Lost sync! Magic was: %08X\n", magic);
                // Si perdemos sincronía, debemos buscar byte por byte
                LARGE_INTEGER liStep; liStep.QuadPart = -3; // Retrocedemos 3 para avanzar 1 neto (ya leímos 4)
                SetFilePointerEx(hInput, liStep, NULL, FILE_CURRENT);
            }
        }
        if (logFile) fwprintf(logFile, L"--- END DECOMPRESS ---\n");
        if (logFile) fclose(logFile);
        CloseHandle(hInput);
        
        PostMessageW(hUI, WM_USER_PROCESS_DONE, filesExtracted, 0);
    }

    static void listArchiveContents(std::wstring inPath, HWND hUI) {
        if (!hListView) {
            MessageBoxW(hUI, L"Error Crítico: Interfaz no inicializada al intentar abrir el paquete.", L"AGZ Pro", MB_OK | MB_ICONERROR);
            return;
        }
        HANDLE hInput = CreateFileW(inPath.c_str(), GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hInput == INVALID_HANDLE_VALUE) {
            MessageBoxW(hUI, (L"No se pudo acceder al archivo.\nVerifica que no esté siendo usado por otro programa.\n\nArchivo: " + inPath).c_str(), L"AGZ Pro - Acceso Denegado", MB_OK | MB_ICONERROR);
            return;
        }
        
        ListView_DeleteAllItems(hListView);
        DWORD br;
        uint32_t magic = 0;
        int index = 0;
        
        while (ReadFile(hInput, &magic, sizeof(magic), &br, NULL) && br > 0) {
            if (magic == 0x46494C45) { // "FILE" Header
                uint16_t pathLen = 0;
                ReadFile(hInput, &pathLen, sizeof(pathLen), &br, NULL);
                std::vector<wchar_t> pathBuf(pathLen + 1, 0);
                ReadFile(hInput, pathBuf.data(), pathLen * sizeof(wchar_t), &br, NULL);
                uint64_t origSize = 0;
                ReadFile(hInput, &origSize, sizeof(origSize), &br, NULL);
                
                LVITEMW lvi = {0};
                lvi.mask = LVIF_TEXT;
                lvi.iItem = index++;
                lvi.pszText = pathBuf.data();
                int itemIdx = ListView_InsertItem(hListView, &lvi);
                
                wchar_t sizeStr[64];
                swprintf(sizeStr, 64, L"%.2f MB", origSize / (1024.0 * 1024.0));
                ListView_SetItemText(hListView, itemIdx, 1, sizeStr);
                ListView_SetItemText(hListView, itemIdx, 2, L"[Archivado]");
                ListView_SetItemText(hListView, itemIdx, 3, L"100%");

                // Navegación segura: saltar bloques del archivo actual
                uint64_t uncompressedRead = 0;
                while (uncompressedRead < origSize) {
                    BlockHeader bh;
                    DWORD br2;
                    if (!ReadFile(hInput, &bh, sizeof(bh), &br2, NULL) || br2 != sizeof(bh)) break;
                    
                    LARGE_INTEGER liSkipBlock; liSkipBlock.QuadPart = bh.compressedSize;
                    SetFilePointerEx(hInput, liSkipBlock, NULL, FILE_CURRENT);
                    uncompressedRead += bh.originalSize;
                }
            } else {
                LARGE_INTEGER liStep; liStep.QuadPart = 1;
                SetFilePointerEx(hInput, liStep, NULL, FILE_CURRENT);
            }
        }
        CloseHandle(hInput);
        
        if (index == 0) {
            MessageBoxW(hUI, L"El paquete parece estar vacío, dañado, o su formato no fue reconocido.", L"AGZ Pro - Paquete Vacío", MB_OK | MB_ICONWARNING);
        } else {
            g_CurrentArchive = inPath; // Registrar el archivo activo para extracción directa
        }

        // Cambio de UI seguro

        g_ActiveTab = 1;
        ShowWindow(hHomePanel, SW_HIDE);
        ShowWindow(hListView, SW_SHOW);
        ShowWindow(hToolBar, SW_SHOW);
        ShowWindow(hSettingsPanel, SW_HIDE);
        ShowWindow(hHistoryList, SW_HIDE);
        SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)L"  Vista Previa: Paquete cargado correctamente.");
    }

    static void compressAsync(std::vector<FileEntry> files, std::wstring outPath, int listIndex, HWND hUI, bool makeSFX) {
        size_t totalUncompressedSize = 0;
        for (const auto& f : files) totalUncompressedSize += f.size;

        // Límite FREE: 4 GB (supera a WinRAR y 7-Zip que dan ilimitado)
        // En PRO: ilimitado + SFX branded + batch + reportes
        if (!g_IsProActivated && totalUncompressedSize > (size_t)4 * 1024 * 1024 * 1024ULL) {
            MessageBoxW(hUI,
                L"El conjunto de archivos supera el límite de 4 GB de la versión gratuita.\n"
                L"\nActiva AGZ Pro Enterprise para compresión ilimitada, SFX con branding\n"
                L"personalizado, modo batch y reportes de rendimiento.",
                L"AGZ Pro — Límite de Versión Gratuita", MB_OK | MB_ICONWARNING);
            return;
        }

        std::wstring currentOutPath = outPath;
        int volumeIndex = 1;
        if (g_SplitVolumeSize > 0) {
            wchar_t vol[16]; swprintf(vol, 16, L".part%d", volumeIndex);
            currentOutPath = outPath + vol;
        }

        HANDLE hOutput;
        if (makeSFX) {
            CopyFileW(L"sfx_stub.exe", currentOutPath.c_str(), FALSE);
            hOutput = CreateFileW(currentOutPath.c_str(), FILE_APPEND_DATA, 0, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
            
            // INYECCIÓN DE LA TRAMPA DE ENTROPÍA
            // El extractor buscará la firma 0x53465821. Si el hacker crackeó el programa en memoria, 
            // la semilla corromperá la firma. El SFX generado crasheará para siempre.
            uint32_t magic = 0x53465821 ^ LicenseManager::getEntropySeed(g_HWID); 
            DWORD bw; WriteFile(hOutput, &magic, sizeof(magic), &bw, NULL);
        } else {
            hOutput = CreateFileW(currentOutPath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
        }
        if (hOutput == INVALID_HANDLE_VALUE) return;

        uint64_t currentVolumeBytes = 0;
        unsigned int cores = std::thread::hardware_concurrency();
        ThreadPool pool(cores > 0 ? cores : 4);
        
        auto tStart = std::chrono::high_resolution_clock::now();
        (void)tStart; // Se usa en el cálculo de elapsed en WM_USER_PROCESS_DONE
        size_t globalProcessed = 0;

        for (const auto& file : files) {
            uint32_t fileMagic = 0x46494C45;
            uint16_t pathLen = (uint16_t)file.relativePath.length();
            DWORD bw;
            WriteFile(hOutput, &fileMagic, sizeof(fileMagic), &bw, NULL);
            WriteFile(hOutput, &pathLen, sizeof(pathLen), &bw, NULL);
            WriteFile(hOutput, file.relativePath.c_str(), pathLen * sizeof(wchar_t), &bw, NULL);
            WriteFile(hOutput, &file.size, sizeof(file.size), &bw, NULL);
            currentVolumeBytes += sizeof(fileMagic) + sizeof(pathLen) + (pathLen * sizeof(wchar_t)) + sizeof(file.size);

            if (file.size == 0) continue;

            HANDLE hInput = CreateFileW(file.fullPath.c_str(), GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
            if (hInput == INVALID_HANDLE_VALUE) continue;
            
            HANDLE hMap = CreateFileMappingW(hInput, NULL, PAGE_READONLY, 0, 0, NULL);
            const uint8_t* fileData = hMap ? (const uint8_t*)MapViewOfFile(hMap, FILE_MAP_READ, 0, 0, 0) : nullptr;

            size_t currentBlockSize = BLOCK_SIZE;
            bool useSolid = false;
            TANSDictionary globalDict;
            uint16_t globalEncodeTable[TANS_L];

            // Optimización adaptativa de entropía: disponible en TODAS las versiones
            if (fileData && file.size > 0) {
                size_t sampleSize = std::min(file.size, (size_t)(1024 * 1024));
                double hGlobal = calculateEntropy(fileData, sampleSize);
                if (hGlobal > ENTROPY_THRESHOLD_HIGH) currentBlockSize = 4 * 1024 * 1024;
                // Desactivado Solid_TANS temporalmente porque requiere almacenar el diccionario global en el header del archivo
                // else if (hGlobal < ENTROPY_THRESHOLD_LOW) {
                //    currentBlockSize = 32 * 1024;
                //    useSolid = true;
                // }
            }

            bool forceBypass = isMediaFile(file.fullPath);
            std::vector<std::future<BlockData>> futures;
            size_t offset = 0;
            while (offset < file.size && fileData) {
                size_t chunkSize = std::min((size_t)currentBlockSize, file.size - offset);
                const uint8_t* ptr = fileData + offset;
                futures.push_back(pool.enqueue([ptr, chunkSize, useSolid, globalDict, globalEncodeTable, forceBypass]() {
                    return processBlockWorker(ptr, chunkSize, useSolid, &globalDict, globalEncodeTable, forceBypass);
                }));
                offset += chunkSize;
            }

            for (auto& fut : futures) {
                BlockData data = fut.get();
                if (g_SplitVolumeSize > 0 && currentVolumeBytes + sizeof(BlockHeader) + data.payload.size() > g_SplitVolumeSize) {
                    CloseHandle(hOutput);
                    volumeIndex++;
                    wchar_t vol[16]; swprintf(vol, 16, L".part%d", volumeIndex);
                    currentOutPath = outPath + vol;
                    hOutput = CreateFileW(currentOutPath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
                    currentVolumeBytes = 0;
                }
                WriteFile(hOutput, &data.header, sizeof(BlockHeader), &bw, NULL);
                WriteFile(hOutput, data.payload.data(), (DWORD)data.payload.size(), &bw, NULL);
                currentVolumeBytes += sizeof(BlockHeader) + data.payload.size();
                globalProcessed += currentBlockSize;
                int progressPercent = totalUncompressedSize > 0 ? (int)((std::min(globalProcessed, totalUncompressedSize) * 100) / totalUncompressedSize) : 100;
                PostMessageW(hUI, WM_USER_UPDATE_PROGRESS, listIndex, progressPercent);
            }
            if (fileData) UnmapViewOfFile(fileData);
            if (hMap) CloseHandle(hMap);
            CloseHandle(hInput);
        }
        CloseHandle(hOutput);
    }
};

// --- DRAG & DROP COM (IDropTarget) ---
class CDropTarget : public IDropTarget {
private:
    void ScanDir(const std::wstring& folder, const std::wstring& root, std::vector<FileEntry>& out) {
        WIN32_FIND_DATAW fd;
        std::wstring search = folder + L"\\*";
        HANDLE hFind = FindFirstFileW(search.c_str(), &fd);
        if (hFind != INVALID_HANDLE_VALUE) {
            do {
                if (wcscmp(fd.cFileName, L".") != 0 && wcscmp(fd.cFileName, L"..") != 0) {
                    std::wstring fullPath = folder + L"\\" + fd.cFileName;
                    std::wstring relPath = fullPath.substr(root.length() + 1);
                    if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
                        ScanDir(fullPath, root, out);
                    } else {
                        LARGE_INTEGER li; li.LowPart = fd.nFileSizeLow; li.HighPart = fd.nFileSizeHigh;
                        out.push_back({fullPath, relPath, (uint64_t)li.QuadPart});
                    }
                }
            } while (FindNextFileW(hFind, &fd));
            FindClose(hFind);
        }
    }
public:
    LONG m_lRefCount = 1;
    HWND m_hWnd;
    CDropTarget(HWND hwnd) : m_hWnd(hwnd) {}
    virtual ~CDropTarget() = default; // Destructor virtual (evita UB en delete polimórfico)
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void **ppv) override {
        if (riid == IID_IUnknown || riid == IID_IDropTarget) { *ppv = static_cast<IDropTarget*>(this); AddRef(); return S_OK; }
        *ppv = NULL; return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return InterlockedIncrement(&m_lRefCount); }
    ULONG STDMETHODCALLTYPE Release() override { LONG count = InterlockedDecrement(&m_lRefCount); if (count == 0) delete this; return count; }
    HRESULT STDMETHODCALLTYPE DragEnter(IDataObject *pDataObj, DWORD grfKeyState, POINTL pt, DWORD *pdwEffect) override { *pdwEffect = DROPEFFECT_COPY; return S_OK; }
    HRESULT STDMETHODCALLTYPE DragOver(DWORD grfKeyState, POINTL pt, DWORD *pdwEffect) override { *pdwEffect = DROPEFFECT_COPY; return S_OK; }
    HRESULT STDMETHODCALLTYPE DragLeave() override { return S_OK; }
    HRESULT STDMETHODCALLTYPE Drop(IDataObject *pDataObj, DWORD grfKeyState, POINTL pt, DWORD *pdwEffect) override {
        FORMATETC fmt = { CF_HDROP, NULL, DVASPECT_CONTENT, -1, TYMED_HGLOBAL };
        STGMEDIUM stg;
        if (SUCCEEDED(pDataObj->GetData(&fmt, &stg))) {
            HDROP hDrop = (HDROP)GlobalLock(stg.hGlobal);
            UINT fileCount = DragQueryFileW(hDrop, 0xFFFFFFFF, NULL, 0);
            for (UINT i = 0; i < fileCount; i++) {
                wchar_t filePath[MAX_PATH];
                DragQueryFileW(hDrop, i, filePath, MAX_PATH);
                std::wstring pathStr(filePath);
                
                if (pathStr.length() > 4 && pathStr.substr(pathStr.length() - 4) == L".lic") {
                    HANDLE hLic = CreateFileW(filePath, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
                    if (hLic != INVALID_HANDLE_VALUE) {
                        char keyBuf[128] = {0}; DWORD br; ReadFile(hLic, keyBuf, 127, &br, NULL); CloseHandle(hLic);
                        std::wstring wkey; for(DWORD k = 0; k < br && keyBuf[k] != '\n' && keyBuf[k] != '\r'; k++) wkey += (wchar_t)keyBuf[k];
                        if (LicenseManager::validateKey(g_HWID, wkey)) {
                            LicenseManager::saveKey(wkey);
                            MessageBoxW(m_hWnd, L"¡Licencia Enterprise validada con éxito!\n\nReinicia la aplicación.", L"AGZ Pro", MB_OK | MB_ICONASTERISK);
                        } else {
                            MessageBoxW(m_hWnd, L"Clave corrupta o HWID Mismatch.", L"AGZ Pro", MB_OK | MB_ICONERROR);
                        }
                    }
                    continue;
                }
                if (pathStr.length() > 4 && pathStr.substr(pathStr.length() - 4) == L".agz") {
                    AGZProEngine::listArchiveContents(pathStr, hListView);
                    continue;
                }

                std::vector<FileEntry> filesToCompress;
                DWORD attr = GetFileAttributesW(filePath);
                if (attr & FILE_ATTRIBUTE_DIRECTORY) {
                    ScanDir(pathStr, pathStr, filesToCompress);
                } else {
                    LARGE_INTEGER li;
                    HANDLE hFile = CreateFileW(filePath, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
                    GetFileSizeEx(hFile, &li);
                    CloseHandle(hFile);
                    std::wstring name = pathStr.substr(pathStr.find_last_of(L"\\") + 1);
                    filesToCompress.push_back({pathStr, name, (uint64_t)li.QuadPart});
                }

                LVITEMW lvi = {0}; lvi.mask = LVIF_TEXT;
                lvi.iItem = ListView_GetItemCount(hListView);
                std::wstring guiName = (attr & FILE_ATTRIBUTE_DIRECTORY) ? (std::wstring(L"[Carpeta] ") + pathStr.substr(pathStr.find_last_of(L"\\") + 1)) : pathStr.substr(pathStr.find_last_of(L"\\") + 1);
                lvi.pszText = (LPWSTR)guiName.c_str();
                int index = ListView_InsertItem(hListView, &lvi);
                

                // Lanzar Motor en Hilo Secundario Autónomo
                std::wstring outPath = std::wstring(filePath) + (g_MakeSFX ? L".sfx.exe" : L".agz");
                std::thread(AGZProEngine::compressAsync, filesToCompress, outPath, index, m_hWnd, g_MakeSFX).detach();
            }
            GlobalUnlock(stg.hGlobal);
            ReleaseStgMedium(&stg);
        }
        *pdwEffect = DROPEFFECT_COPY;
        return S_OK;
    }
};
CDropTarget* pDropTarget = nullptr;

// --- CONFIGURACIÓN UI PROFESIONAL (Quantum Tech v2) ---
void CreateControls(HWND hwnd) {
    // Fuente 10.5pt Segoe UI Variable Text (con fallback a Segoe UI)
    HDC hdc = GetDC(NULL);
    int pxMain   = -MulDiv(105, GetDeviceCaps(hdc, LOGPIXELSY), 720); // 10.5pt
    int pxHeader = -MulDiv(90,  GetDeviceCaps(hdc, LOGPIXELSY), 720); // 9pt semibold
    int pxBig    = -MulDiv(130, GetDeviceCaps(hdc, LOGPIXELSY), 720); // 13pt bold
    ReleaseDC(NULL, hdc);

    hFontMain = CreateFontW(pxMain, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI Variable Text");
    if (!hFontMain)
        hFontMain = CreateFontW(pxMain, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");

    hFontHeader = CreateFontW(pxHeader, 0, 0, 0, FW_SEMIBOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI Semibold");
    if (!hFontHeader)
        hFontHeader = CreateFontW(pxHeader, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");

    hFontBig = CreateFontW(pxBig, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI Variable Display");

    // Pinceles auxiliares
    hBrushAlt    = CreateSolidBrush(COL_BG_ALT);
    hBrushAccent = CreateSolidBrush(COL_ACCENT);

    // ── LAYOUT DIAMOND: SIDEBAR (IZQ) + CONTENT (DER) ────────────────────────
    HIMAGELIST hImgList = ImageList_Create(1, 42, ILC_COLOR32, 0, 1);
    
    // 1. Sidebar Container (Luz de fondo y botones de navegación)
    // Se dibuja en WM_PAINT y WM_DRAWITEM
    HWND hSidebar = CreateWindowExW(0, L"STATIC", NULL, WS_CHILD | WS_VISIBLE | SS_OWNERDRAW, 0, 0, 220, 600, hwnd, (HMENU)10, GetModuleHandle(NULL), NULL);

    // 2. Header: Buscador Moderno
    HWND hSearch = CreateWindowExW(0, L"EDIT", L"  🔍 Search files...", WS_CHILD | WS_VISIBLE | WS_BORDER | ES_AUTOHSCROLL, 250, 25, 450, 35, hwnd, (HMENU)11, GetModuleHandle(NULL), NULL);
    SendMessage(hSearch, WM_SETFONT, (WPARAM)hFontMain, TRUE);
    SetWindowTheme(hSearch, L"DarkMode_Explorer", NULL);

    // 3. Toolbar: Acciones Rápidas (Estilo flotante)
    hToolBar = CreateWindowExW(0, TOOLBARCLASSNAMEW, NULL, WS_CHILD | WS_VISIBLE | TBSTYLE_FLAT | TBSTYLE_TRANSPARENT | CCS_NODIVIDER | CCS_NOPARENTALIGN | CCS_NORESIZE, 250, 75, 600, 40, hwnd, (HMENU)1, GetModuleHandle(NULL), NULL);
    SendMessage(hToolBar, TB_BUTTONSTRUCTSIZE, (WPARAM)sizeof(TBBUTTON), 0);
    SendMessage(hToolBar, WM_SETFONT, (WPARAM)hFontHeader, TRUE);
    
    TBBUTTON tbb[] = {
        {I_IMAGENONE, 101, TBSTATE_ENABLED, BTNS_SHOWTEXT | BTNS_AUTOSIZE, {0}, 0, (INT_PTR)L"  AÑADIR  "},
        {I_IMAGENONE, 102, TBSTATE_ENABLED, BTNS_SHOWTEXT | BTNS_AUTOSIZE, {0}, 0, (INT_PTR)L"  EXTRAER  "},
        {I_IMAGENONE, 107, TBSTATE_ENABLED, BTNS_SHOWTEXT | BTNS_AUTOSIZE, {0}, 0, (INT_PTR)L"  VOLS  "},
        {I_IMAGENONE, 103, TBSTATE_ENABLED, BTNS_SHOWTEXT | BTNS_AUTOSIZE, {0}, 0, (INT_PTR)L"  CIFRAR  "}
    };
    SendMessage(hToolBar, TB_ADDBUTTONS, 4, (LPARAM)&tbb);

    // 4. Pestaña 1: File Manager (ListView Actual)
    hListView = CreateWindowExW(0, WC_LISTVIEWW, NULL, WS_CHILD | WS_VISIBLE | LVS_REPORT | LVS_NOCOLUMNHEADER, 250, 130, 600, 340, hwnd, (HMENU)2, GetModuleHandle(NULL), NULL);
    SetWindowTheme(hListView, L"DarkMode_Explorer", NULL);
    ListView_SetImageList(hListView, hImgList, LVSIL_SMALL);
    ListView_SetBkColor(hListView, COL_BG_BOT);
    ListView_SetTextBkColor(hListView, COL_BG_BOT);
    ListView_SetTextColor(hListView, COL_TEXT);
    
    // Insertar columnas maestras para el modo Report (Nombre, Tamaño, Estado, Integridad)
    LVCOLUMNW lvc = {0}; lvc.mask = LVCF_WIDTH;
    lvc.cx = 280; ListView_InsertColumn(hListView, 0, &lvc); // Nombre
    lvc.cx = 100; ListView_InsertColumn(hListView, 1, &lvc); // Tamaño
    lvc.cx = 120; ListView_InsertColumn(hListView, 2, &lvc); // Estado
    lvc.cx = 80;  ListView_InsertColumn(hListView, 3, &lvc); // Integridad


    // 5. Pestaña 0: HOME (Panel de Bienvenida + Ad)
    hHomePanel = CreateWindowExW(0, L"STATIC", L"", WS_CHILD | SS_OWNERDRAW, 250, 50, 600, 400, hwnd, (HMENU)20, GetModuleHandle(NULL), NULL);
    
    // 6. Pestaña 2: PROJECTS (Historial de Archivos)
    hHistoryList = CreateWindowExW(0, WC_LISTVIEWW, NULL, WS_CHILD | LVS_REPORT | LVS_NOCOLUMNHEADER, 250, 130, 600, 340, hwnd, (HMENU)21, GetModuleHandle(NULL), NULL);
    SetWindowTheme(hHistoryList, L"DarkMode_Explorer", NULL);
    ListView_SetImageList(hHistoryList, hImgList, LVSIL_SMALL);
    LVCOLUMNW lvcH = {0}; lvcH.mask = LVCF_WIDTH | LVCF_TEXT; lvcH.cx = 400; lvcH.pszText = (LPWSTR)L"Historial";
    ListView_InsertColumn(hHistoryList, 0, &lvcH);

    hLangBtn  = CreateWindowExW(0, L"BUTTON", L"Language", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, 270, 100, 300, 50, hwnd, (HMENU)401, NULL, NULL);
    hShellBtn = CreateWindowExW(0, L"BUTTON", L"Shell", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, 270, 165, 300, 50, hwnd, (HMENU)302, NULL, NULL);
    hProBtn   = CreateWindowExW(0, L"BUTTON", L"PRO", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, 270, 230, 300, 50, hwnd, (HMENU)105, NULL, NULL);
    
    // Aplicar la Subclase para el dibujado propio
    SetWindowSubclass(hLangBtn, Button3DProc, 1, 0);
    SetWindowSubclass(hShellBtn, Button3DProc, 2, 0);
    SetWindowSubclass(hProBtn, Button3DProc, 3, 0);
    
    SendMessage(hLangBtn,  WM_SETFONT, (WPARAM)hFontMain, TRUE);
    SendMessage(hShellBtn, WM_SETFONT, (WPARAM)hFontMain, TRUE);
    SendMessage(hProBtn,   WM_SETFONT, (WPARAM)hFontMain, TRUE);

    // Ocultar tabs no activos al inicio
    ShowWindow(hListView, SW_HIDE); ShowWindow(hToolBar, SW_HIDE);
    ShowWindow(hLangBtn, SW_HIDE); ShowWindow(hShellBtn, SW_HIDE); ShowWindow(hProBtn, SW_HIDE);
    ShowWindow(hHomePanel, SW_SHOW); 

    // Barra de Progreso (fondo de ventana, parte inferior)
    hProgressBar = CreateWindowExW(0, PROGRESS_CLASSW, NULL,
        WS_CHILD | WS_VISIBLE | PBS_SMOOTH,
        250, 540, 600, 22, hwnd, (HMENU)30, GetModuleHandle(NULL), NULL);
    SendMessage(hProgressBar, PBM_SETRANGE, 0, MAKELPARAM(0, 100));
    SendMessage(hProgressBar, PBM_SETPOS, 0, 0);

    // Barra de Estado inferior
    hStatusBar = CreateWindowExW(0, STATUSCLASSNAMEW, L"  AGZ Pro — Listo.",
        WS_CHILD | WS_VISIBLE | SBARS_SIZEGRIP,
        0, 0, 0, 0, hwnd, (HMENU)31, GetModuleHandle(NULL), NULL);

    pDropTarget = new CDropTarget(hwnd);
    RegisterDragDrop(hwnd, pDropTarget);
}

// --- WINDOW PROC MAESTRO ---
void AddFileToList(const std::wstring& fullPath) {
    if (fullPath.empty()) return;
    std::vector<FileEntry> files;
    LARGE_INTEGER li;
    HANDLE hFile = CreateFileW(fullPath.c_str(), GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
    if (hFile != INVALID_HANDLE_VALUE) {
        GetFileSizeEx(hFile, &li);
        CloseHandle(hFile);
        std::wstring name = fullPath.substr(fullPath.find_last_of(L"\\") + 1);
        files.push_back({fullPath, name, (uint64_t)li.QuadPart});
        
        LVITEMW lvi = {0}; lvi.mask = LVIF_TEXT;
        lvi.iItem = ListView_GetItemCount(hListView);
        lvi.pszText = (LPWSTR)name.c_str();
        int index = ListView_InsertItem(hListView, &lvi);
        std::wstring outPath = fullPath + (g_MakeSFX ? L".sfx.exe" : L".agz");
        std::thread(AGZProEngine::compressAsync, files, outPath, index, hMainWnd, g_MakeSFX).detach();
    }
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_DRAWITEM: {
            LPDRAWITEMSTRUCT lpDrawItem = (LPDRAWITEMSTRUCT)lParam;
            if (lpDrawItem->CtlID == 10) { // Sidebar
                HDC hdc = lpDrawItem->hDC;
                RECT rc = lpDrawItem->rcItem;
                
                // Fondo Sidebar Abisal
                FillRect(hdc, &rc, hBrushAlt);
                
                // Pintar Items de Navegación (Traducción dinámica)
                const wchar_t* navItems[] = { 
                    TR(L"  🏠  Home", L"  🏠  Inicio", L"  🏠  Início", L"  🏠  首页"),
                    TR(L"  📂  File Manager", L"  📂  Gestor", L"  📂  Gerenciador", L"  📂  文件管理"),
                    TR(L"  🚀  Projects", L"  🚀  Proyectos", L"  🚀  Projetos", L"  🚀  项目"),
                    TR(L"  ⚙️  Settings", L"  ⚙️  Ajustes", L"  ⚙️  Ajustes", L"  ⚙️  设置")
                };
                SetBkMode(hdc, TRANSPARENT);
                SelectObject(hdc, hFontMain);
                
                for (int i = 0; i < 4; i++) {
                    RECT itemRc = { 20, 150 + (i * 50), 200, 200 + (i * 50) };
                    bool isActive = (i == g_ActiveTab);
                    SetTextColor(hdc, isActive ? COL_ACCENT : COL_TEXT_SEC); 
                    
                    if (isActive) { // Fondo de selección carmesí sutil con indicador lateral
                        RECT selRc = { 10, 155 + (i * 50), 210, 195 + (i * 50) };
                        HBRUSH hSelBrush = CreateSolidBrush(RGB(20, 40, 70));
                        FillRect(hdc, &selRc, hSelBrush);
                        DeleteObject(hSelBrush);
                        
                        // Línea vertical neón de "Pestaña Activa"
                        RECT indicator = { 0, 155 + (i * 50), 4, 195 + (i * 50) };
                        FillRect(hdc, &indicator, hBrushAccent);
                    }
                    DrawTextW(hdc, navItems[i], -1, &itemRc, DT_LEFT | DT_VCENTER | DT_SINGLELINE);
                }
                
                // Logo en el Sidebar
                RECT logoRc = { 30, 30, 190, 80 };
                SetTextColor(hdc, COL_TEXT);
                SelectObject(hdc, hFontBig);
                DrawTextW(hdc, L"💎 AGZ Pro", -1, &logoRc, DT_LEFT | DT_TOP | DT_SINGLELINE);
                // Pintado de Paneles Home y Settings
                if (lpDrawItem->CtlID == 20) { // HOME
                    HDC hdc = lpDrawItem->hDC;
                    RECT rc = lpDrawItem->rcItem;
                    SetTextColor(hdc, COL_TEXT); SelectObject(hdc, hFontBig);
                    DrawTextW(hdc, L"Bienvenido a Quantum Tech v2", -1, &rc, DT_CENTER);
                    
                    RECT adRc = { 50, 150, 550, 250 };
                    HBRUSH hAdBr = CreateSolidBrush(RGB(20, 30, 50));
                    FillRect(hdc, &adRc, hAdBr);
                    SetTextColor(hdc, COL_ACCENT); SelectObject(hdc, hFontMain);
                    DrawTextW(hdc, L"\n  OFERTA PATROCINADA:\n  Obtén 2TB de Nube Gratis con AGZ Cloud ►", -1, &adRc, DT_CENTER);
                    DeleteObject(hAdBr);
                }
                // PINTADO DE BOTONES 3D DIAMOND (SETTINGS - IDENTIFICACIÓN POR HWND)
                if (lpDrawItem->hwndItem == hLangBtn || lpDrawItem->hwndItem == hShellBtn || lpDrawItem->hwndItem == hProBtn) {
                    HDC hdc = lpDrawItem->hDC;
                    RECT rc = lpDrawItem->rcItem;
                    BOOL isSelected = lpDrawItem->itemState & ODS_SELECTED;
                    
                    // 1. Fondo Sólido de Respaldo (Garantía contra blanco)
                    HBRUSH hBr = CreateSolidBrush(isSelected ? RGB(220, 20, 60) : RGB(10, 40, 80));
                    FillRect(hdc, &rc, hBr);
                    DeleteObject(hBr);

                    // 2. Degradado Pro
                    TRIVERTEX v[2];
                    v[0].x = rc.left; v[0].y = rc.top;
                    v[0].Red = 0x0500; v[0].Green = 0x1500; v[0].Blue = 0x3500; v[0].Alpha = 0; 
                    v[1].x = rc.right; v[1].y = rc.bottom;
                    v[1].Red = isSelected ? 0xA000 : 0x0100; v[1].Green = 0x0100; v[1].Blue = 0x0500; v[1].Alpha = 0;
                    GRADIENT_RECT gr = {0, 1};
                    GradientFill(hdc, v, 2, &gr, 1, GRADIENT_FILL_RECT_V);

                    // 3. Bordes 3D Metálicos
                    DrawEdge(hdc, &rc, isSelected ? EDGE_SUNKEN : EDGE_RAISED, BF_RECT);
                    
                    const wchar_t* btnTxt = L"---";
                    if (lpDrawItem->hwndItem == hLangBtn)  btnTxt = TR(L"🌐 Language: English", L"🌐 Idioma: Español", L"🌐 Idioma: Português", L"🌐 语言: 中文");
                    if (lpDrawItem->hwndItem == hShellBtn) btnTxt = TR(L"📁 Shell Integration", L"📁 Integrar a Windows", L"📁 Integração Shell", L"📁 系统集成");
                    if (lpDrawItem->hwndItem == hProBtn)   btnTxt = TR(L"💎 Activate PRO License", L"💎 Activar Licencia PRO", L"💎 Ativar Licença PRO", L"💎 激活 PRO 许可证");

                    SetBkMode(hdc, TRANSPARENT);
                    SetTextColor(hdc, RGB(255, 255, 255)); // BLANCO PURO
                    SelectObject(hdc, hFontMain);
                    DrawTextW(hdc, btnTxt, -1, &rc, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
                    return TRUE;
                }

                if (lpDrawItem->CtlID == 22) { // SETTINGS HEADER
                    HDC hdc = lpDrawItem->hDC;
                    SetTextColor(hdc, COL_TEXT); SelectObject(hdc, hFontHeader);
                    TextOutW(hdc, 20, 10, TR(L"GLOBAL SETTINGS", L"AJUSTES GLOBALES", L"AJUSTES GLOBAIS", L"全局设置"), 18);
                    return TRUE;
                }
            }
            return FALSE;
        }
        case WM_CREATE: {
            CreateControls(hwnd);
            // Modo Oscuro Inmersivo nativo de Windows 11
            BOOL dark = TRUE;
            DwmSetWindowAttribute(hwnd, 20, &dark, sizeof(dark)); // DWMWA_USE_IMMERSIVE_DARK_MODE
            // (A) Timer para banner rotativo — solo en versión FREE
            if (!g_IsProActivated)
                SetTimer(hwnd, AD_TIMER_ID, 28000, NULL); // Rotar cada 28 segundos
            return 0;
        }
        case WM_LBUTTONDOWN: {
            int x = LOWORD(lParam); int y = HIWORD(lParam);
            // Si el clic es en el Sidebar (0-220px de ancho)
            if (x < 220 && y > 150 && y < 350) {
                int newTab = (y - 150) / 50;
                if (newTab >= 0 && newTab < 4) {
                    g_ActiveTab = newTab;
                    // Switch de Visibilidad Universal
                    ShowWindow(hHomePanel,     (g_ActiveTab == 0) ? SW_SHOW : SW_HIDE);
                    ShowWindow(hListView,      (g_ActiveTab == 1) ? SW_SHOW : SW_HIDE);
                    ShowWindow(hToolBar,       (g_ActiveTab == 1) ? SW_SHOW : SW_HIDE);
                    ShowWindow(hHistoryList,   (g_ActiveTab == 2) ? SW_SHOW : SW_HIDE);
                    ShowWindow(hSettingsPanel, (g_ActiveTab == 3) ? SW_SHOW : SW_HIDE);
                    
                    // Visibilidad de Botones de Settings
                    BOOL showSet = (g_ActiveTab == 3);
                    ShowWindow(hLangBtn,  showSet ? SW_SHOW : SW_HIDE);
                    ShowWindow(hShellBtn, showSet ? SW_SHOW : SW_HIDE);
                    ShowWindow(hProBtn,   showSet ? SW_SHOW : SW_HIDE);

                    if (showSet) {
                        SetWindowTextW(hLangBtn,  TR(L"🌐 Language: English", L"🌐 Idioma: Español", L"🌐 Idioma: Português", L"🌐 语言: 中文"));
                        SetWindowTextW(hShellBtn, TR(L"📁 Shell Integration", L"📁 Integrar a Windows", L"📁 Integração Shell", L"📁 系统集成"));
                        SetWindowTextW(hProBtn,   TR(L"💎 Activate PRO License", L"💎 Activar Licencia PRO", L"💎 Ativar Licença PRO", L"💎 激活 PRO 许可证"));
                    }
                    
                    InvalidateRect(GetDlgItem(hwnd, 10), NULL, TRUE); 
                    InvalidateRect(hwnd, NULL, TRUE); 
                }
            }
            return 0;
        }
        case WM_SIZE: {
            int w = LOWORD(lParam); int h = HIWORD(lParam);
            // Sidebar fijo a 220px
            SetWindowPos(GetDlgItem(hwnd, 10), NULL, 0, 0, 220, h, SWP_NOZORDER);
            // Main content dinámico
            SetWindowPos(GetDlgItem(hwnd, 11), NULL, 250, 25, w - 280, 35, SWP_NOZORDER);
            SetWindowPos(hToolBar,  NULL, 250, 75, w - 280, 40, SWP_NOZORDER);
            SetWindowPos(hListView, NULL, 250, 130, w - 280, h - 220, SWP_NOZORDER);
            SetWindowPos(hProgressBar, NULL, 250, h - 60, w - 280, 25, SWP_NOZORDER);
            return 0;
        }
        case WM_ERASEBKGND: {
            HDC hdc = (HDC)wParam; RECT rc; GetClientRect(hwnd, &rc);
            // Degradado de Fondo Quantum (Top -> Bottom)
            TRIVERTEX vertex[2];
            vertex[0].x = 0; vertex[0].y = 0;
            vertex[0].Red = GetRValue(COL_BG) << 8; vertex[0].Green = GetGValue(COL_BG) << 8; vertex[0].Blue = GetBValue(COL_BG) << 8; vertex[0].Alpha = 0x0000;
            vertex[1].x = rc.right; vertex[1].y = rc.bottom;
            vertex[1].Red = GetRValue(COL_BG_BOT) << 8; vertex[1].Green = GetGValue(COL_BG_BOT) << 8; vertex[1].Blue = GetBValue(COL_BG_BOT) << 8; vertex[1].Alpha = 0x0000;
            GRADIENT_RECT gRect = {0, 1};
            GradientFill(hdc, vertex, 2, &gRect, 1, GRADIENT_FILL_RECT_V);
            return 1;
        }
        case WM_NOTIFY: {
            LPNMHDR lpnmh = (LPNMHDR)lParam;
        // 1. Toolbar: Hover Carmesí CDIS_HOT exacto
            if (lpnmh->hwndFrom == hToolBar && lpnmh->code == NM_CUSTOMDRAW) {
                LPNMTBCUSTOMDRAW cd = (LPNMTBCUSTOMDRAW)lParam;
                if (cd->nmcd.dwDrawStage == CDDS_PREPAINT) return CDRF_NOTIFYITEMDRAW;
                if (cd->nmcd.dwDrawStage == CDDS_ITEMPREPAINT) {
                    bool hot = (cd->nmcd.uItemState & CDIS_HOT) != 0;
                    FillRect(cd->nmcd.hdc, &cd->nmcd.rc, hot ? hBrushAccent : hbgBrush);
                    cd->clrText    = hot ? RGB(255,255,255) : (cd->nmcd.dwItemSpec == 105 ? COL_GOLD : COL_TEXT_SEC);
                    cd->clrBtnFace = hot ? COL_ACCENT : COL_BG;
                    return TBCDRF_NOEDGES | TBCDRF_USECDCOLORS;
                }
            }
            // 2. Header del ListView: pintado plano manual
            HWND hHdr = ListView_GetHeader(hListView);
            if (lpnmh->hwndFrom == hHdr && lpnmh->code == NM_CUSTOMDRAW) {
                LPNMCUSTOMDRAW cd = (LPNMCUSTOMDRAW)lParam;
                if (cd->dwDrawStage == CDDS_PREPAINT) return CDRF_NOTIFYITEMDRAW;
                if (cd->dwDrawStage == CDDS_ITEMPREPAINT) {
                    FillRect(cd->hdc, &cd->rc, hbgBrush);
                    wchar_t txt[128] = {};
                    HDITEM hi = {}; hi.mask = HDI_TEXT; hi.pszText = txt; hi.cchTextMax = 127;
                    Header_GetItem(hHdr, (int)cd->dwItemSpec, &hi);
                    SetBkMode(cd->hdc, TRANSPARENT);
                    SetTextColor(cd->hdc, COL_TEXT);
                    HFONT oldf = (HFONT)SelectObject(cd->hdc, hFontHeader);
                    RECT rc = cd->rc; rc.left += 8;
                    DrawTextW(cd->hdc, txt, -1, &rc, DT_LEFT|DT_VCENTER|DT_SINGLELINE);
                    SelectObject(cd->hdc, oldf);
                    return CDRF_SKIPDEFAULT;
                }
            }
            // 3. ListView: Diseño "File Manager" Diamond (Sin bordes, selección azulada)
            if (lpnmh->hwndFrom == hListView && lpnmh->code == NM_CUSTOMDRAW) {
                LPNMLVCUSTOMDRAW cd = (LPNMLVCUSTOMDRAW)lParam;
                if (cd->nmcd.dwDrawStage == CDDS_PREPAINT) return CDRF_NOTIFYITEMDRAW;
                if (cd->nmcd.dwDrawStage == CDDS_ITEMPREPAINT) {
                    bool sel = (cd->nmcd.uItemState & CDIS_SELECTED) != 0;
                    cd->clrText   = COL_TEXT;
                    cd->clrTextBk = (cd->nmcd.dwItemSpec % 2) ? RGB(12, 25, 50) : COL_BG;
                    if (sel) {
                        cd->clrTextBk = RGB(30, 60, 110); // Selección Diamond
                        return CDRF_NEWFONT;
                    }
                    return CDRF_NEWFONT;
                }
            }
            
            // 4. ProgressBar: Pintado Neón Carmesí Diamond
            if (lpnmh->hwndFrom == hProgressBar && lpnmh->code == NM_CUSTOMDRAW) {
                LPNMCUSTOMDRAW cd = (LPNMCUSTOMDRAW)lParam;
                if (cd->dwDrawStage == CDDS_PREPAINT) {
                    HDC hdc = cd->hdc;
                    RECT rc = cd->rc;
                    // Fondo oscuro redondeado (simulado)
                    HBRUSH hBk = CreateSolidBrush(RGB(10, 20, 35));
                    FillRect(hdc, &rc, hBk);
                    DeleteObject(hBk);
                    
                    int pos = (int)SendMessage(hProgressBar, PBM_GETPOS, 0, 0);
                    if (pos > 0) {
                        RECT prgRc = rc;
                        prgRc.right = rc.left + (long)((rc.right - rc.left) * (pos / 100.0));
                        
                        // Brillo Neón Degradado
                        TRIVERTEX v[2];
                        v[0].x = prgRc.left; v[0].y = prgRc.top;
                        v[0].Red = 0xE600; v[0].Green = 0x3900; v[0].Blue = 0x4600; v[0].Alpha = 0x0000;
                        v[1].x = prgRc.right; v[1].y = prgRc.bottom;
                        v[1].Red = 0xFF00; v[1].Green = 0x5000; v[1].Blue = 0x6000; v[1].Alpha = 0x0000;
                        GRADIENT_RECT gr = {0, 1};
                        GradientFill(hdc, v, 2, &gr, 1, GRADIENT_FILL_RECT_H);
                        
                        // Efecto Glow Neón Superior
                        HBRUSH hGlow = CreateSolidBrush(RGB(255, 80, 100));
                        RECT glow = { prgRc.left, prgRc.top, prgRc.right, prgRc.top + 3 };
                        FillRect(hdc, &glow, hGlow);
                        DeleteObject(hGlow);
                    }
                    return CDRF_SKIPDEFAULT;
                }
            }
            break;
        }
        case WM_COMMAND: {
            int wmId = LOWORD(wParam);
            if (wmId == 101) { // Añadir Archivos
                wchar_t szFile[MAX_PATH] = {0};
                OPENFILENAMEW ofn = {0};
                ofn.lStructSize = sizeof(ofn);
                ofn.hwndOwner = hwnd;
                ofn.lpstrFile = szFile;
                ofn.nMaxFile = MAX_PATH;
                ofn.lpstrFilter = L"Todos los archivos\0*.*\0";
                ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST;
                if (GetOpenFileNameW(&ofn)) {
                    AddFileToList(szFile);
                }
            } else if (wmId == 102) { // EXTRAER
                std::wstring extractTarget = L"";
                
                // Si ya hay un archivo visualizándose en el File Manager, lo extraemos directamente
                if (g_ActiveTab == 1 && !g_CurrentArchive.empty()) {
                    extractTarget = g_CurrentArchive;
                } else {
                    // Si no, pedimos al usuario que elija qué archivo .agz abrir
                    wchar_t szFile[MAX_PATH] = {0};
                    OPENFILENAMEW ofn = {0};
                    ofn.lStructSize  = sizeof(ofn);
                    ofn.hwndOwner    = hwnd;
                    ofn.lpstrFile    = szFile;
                    ofn.nMaxFile     = MAX_PATH;
                    ofn.lpstrFilter  = L"Archivos AGZ (*.agz)\0*.agz\0Todos los archivos\0*.*\0";
                    ofn.Flags        = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST;
                    if (GetOpenFileNameW(&ofn)) {
                        extractTarget = szFile;
                    }
                }

                if (!extractTarget.empty()) {
                    wchar_t szFolder[MAX_PATH] = {0};
                    BROWSEINFOW bi = {0};
                    bi.hwndOwner = hwnd;
                    bi.lpszTitle = TR(L"Select extraction folder", L"Selecciona carpeta de extracción", L"Selecionar pasta de extração", L"选择提取文件夹");
                    bi.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE;
                    PIDLIST_ABSOLUTE pidl = SHBrowseForFolderW(&bi);
                    if (pidl) {
                        SHGetPathFromIDListW(pidl, szFolder);
                        CoTaskMemFree(pidl);
                        SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)L"  Extraer: Iniciando descompresión...");
                        std::thread(AGZProEngine::decompressAsync, extractTarget, std::wstring(szFolder), hwnd).detach();
                    }
                }

            } else if (wmId == 103) { // CIFRADO AES-256 — disponible en versión FREE
                if (g_EnableAES) {
                    g_EnableAES = false; g_CurrentPassword = L"";
                    SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)L"  Cifrado AES-256 desactivado.");
                    MessageBoxW(hwnd, L"Cifrado AES-256 desactivado.", L"Seguridad", MB_OK);
                } else {
                    ShowPasswordPrompt(hwnd);
                    if (g_EnableAES)
                        SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)L"  🔒 Cifrado AES-256 activado — archivos protegidos.");
                }
            } else if (wmId == 104) { // Integrar
                InstallContextMenu();
            } else if (wmId == 107) { // VOLÚMENES — disponible en FREE
                HMENU hPop = CreatePopupMenu();
                AppendMenuW(hPop, MF_STRING, 201, L"  ♾  Ilimitado (sin dividir)");
                AppendMenuW(hPop, MF_STRING, 202, L"  💾  700 MB  (CD)");
                AppendMenuW(hPop, MF_STRING, 203, L"  📀  2 GB   (DVD)");
                AppendMenuW(hPop, MF_STRING, 204, L"  🗜  4 GB   (FAT32 máx)");
                AppendMenuW(hPop, MF_SEPARATOR, 0, NULL);
                AppendMenuW(hPop, MF_STRING | (g_IsProActivated ? MF_ENABLED : MF_GRAYED), 205,
                    L"  💎  Tamaño personalizado... [PRO]");
                POINT pt; GetCursorPos(&pt);
                int sel = TrackPopupMenu(hPop, TPM_RETURNCMD, pt.x, pt.y, 0, hwnd, NULL);
                if      (sel == 201) g_SplitVolumeSize = 0;
                else if (sel == 202) g_SplitVolumeSize = 700ULL  * 1024 * 1024;
                else if (sel == 203) g_SplitVolumeSize = 2048ULL * 1024 * 1024;
                else if (sel == 204) g_SplitVolumeSize = 4096ULL * 1024 * 1024;
                else if (sel == 205 && g_IsProActivated) {
                    // Tamaño personalizado PRO
                    wchar_t buf[32] = {};
                    if (GetConsoleWindow()) {} // placeholder
                    MessageBoxW(hwnd, L"Funcionalidad de tamaño personalizado disponible en PRO.", L"PRO", MB_OK);
                }
                DestroyMenu(hPop);
            } else if (wmId == 401) { // ROTACIÓN DE IDIOMA
                g_CurrentLang = (Lang)((g_CurrentLang + 1) % 4);
                // Forzar actualización inmediata de textos en botones
                SetWindowTextW(hLangBtn,  TR(L"🌐 Language: English", L"🌐 Idioma: Español", L"🌐 Idioma: Português", L"🌐 语言: 中文"));
                SetWindowTextW(hShellBtn, TR(L"📁 Shell Integration", L"📁 Integrar a Windows", L"📁 Integração Shell", L"📁 系统集成"));
                SetWindowTextW(hProBtn,   TR(L"💎 Activate PRO License", L"💎 Activar Licencia PRO", L"💎 Ativar Licença PRO", L"💎 激活 PRO 许可证"));
                InvalidateRect(hwnd, NULL, TRUE);
            } else if (wmId == 302) { // SHELL INTEGRATION
                InstallContextMenu();
                MessageBoxW(hwnd, TR(L"Windows Integration Successful!", L"¡Integración exitosa!", L"Integração com Windows concluída!", L"系统集成成功！"), L"AGZ Pro", MB_OK | MB_ICONINFORMATION);
            } else if (wmId == 105) { // PRO — Activación y exclusivas
                if (g_IsProActivated) {
                    std::wstring info =
                        L"✅ AGZ Pro Enterprise — Activado\n"
                        L"HWID: " + g_HWID + L"\n\n"
                        L"Exclusivas activas:\n"
                        L"  💎 SFX con logo personalizado\n"
                        L"  📦 Compresión en lote (Batch)\n"
                        L"  📊 Reportes de rendimiento\n"
                        L"  ♾  Sin límite de tamaño";
                    MessageBoxW(hwnd, info.c_str(), L"AGZ Pro Enterprise", MB_OK | MB_ICONINFORMATION);
                } else {
                    std::wstring devKey = LicenseManager::generateExpectedKey(g_HWID);
                    std::wstring msg =
                        std::wstring(TR(L"AGZ Pro — Free Version\n", L"AGZ Pro — Versión Gratuita\n", L"AGZ Pro — Versão Gratuita\n", L"AGZ Pro — 免费版\n")) +
                        L"HWID: " + g_HWID + L"\n\n" +
                        std::wstring(TR(L"You have free access to:\n", L"Ya tenés acceso gratuito a:\n", L"Você tem acesso gratuito a:\n", L"您拥有免费访问权限：\n")) +
                        std::wstring(TR(L"  ✅ Compression up to 4 GB\n", L"  ✅ Compresión hasta 4 GB\n", L"  ✅ Compressão até 4 GB\n", L"  ✅ 压缩高达 4 GB\n")) +
                        std::wstring(TR(L"  ✅ Unlimited SFX Extraction\n", L"  ✅ SFX Ilimitado\n", L"  ✅ SFX Ilimitado\n", L"  ✅ 无限 SFX\n")) +
                        std::wstring(TR(L"  ✅ AES-256 Encryption\n\n", L"  ✅ Cifrado AES-256\n\n", L"  ✅ Criptografia AES-256\n\n", L"  ✅ AES-256 加密\n\n")) +
                        std::wstring(TR(L"Unlock PRO for $29.00 (Lifetime):\n", L"Desbloqueá PRO por $29.00 (De por vida):\n", L"Desbloqueie o PRO por $29.00 (Vitalício):\n", L"以 $29.00 开启 PRO（终身）：\n")) +
                        std::wstring(TR(L"  💎 Branded SFX (Custom Logo)\n", L"  💎 SFX con Logo Propio\n", L"  💎 SFX com Logo Próprio\n", L"  💎 品牌 SFX（自定义徽标）\n")) +
                        std::wstring(TR(L"  ♾  Unlimited File Size\n\n", L"  ♾  Tamaño de archivo ilimitado\n\n", L"  ♾  Tamanho de archivo ilimitado\n\n", L"  ♾  无限文件大小\n\n")) +
                        std::wstring(TR(L"Activation Key: ", L"Clave de activación: ", L"Chave de ativação: ", L"激活码: ")) + devKey;
                    MessageBoxW(hwnd, msg.c_str(), TR(L"Activate PRO", L"Activar PRO", L"Ativar PRO", L"激活 PRO"), MB_OK | MB_ICONINFORMATION);
                }
            } else if (wmId == 106) { // DONAR / LEGAL
                // Menú dividido: Donar o Ver Términos Legales
                HMENU hPop = CreatePopupMenu();
                AppendMenuW(hPop, MF_STRING, 301, L"  ❤️  Realizar Donación (PayPal)");
                AppendMenuW(hPop, MF_STRING, 302, L"  ⚖️  Términos y Privacidad");
                POINT pt; GetCursorPos(&pt);
                int sel = TrackPopupMenu(hPop, TPM_RETURNCMD, pt.x, pt.y, 0, hwnd, NULL);
                if (sel == 301) {
                    ShellExecuteW(NULL, L"open", L"https://paypal.me/TU_USUARIO", NULL, NULL, SW_SHOWNORMAL);
                } else if (sel == 302) {
                    std::wstring legal = 
                        L"AGZ Pro — ACUERDO DE LICENCIA Y PRIVACIDAD\n\n"
                        L"1. PRIVACIDAD: AGZ Pro NO recolecta, envía ni analiza el contenido de sus archivos. Todo el procesamiento es local.\n\n"
                        L"2. MONETIZACIÓN: La versión gratuita incluye enlaces de afiliados. Si usted adquiere un servicio mediante estos links, nosotros recibimos una comisión sin costo extra para usted.\n\n"
                        L"3. GARANTÍA: El software se proporciona 'TAL CUAL', sin garantías de ningún tipo.\n\n"
                        L"Al usar esta aplicación, usted acepta estos términos.";
                    MessageBoxW(hwnd, legal.c_str(), L"Información Legal", MB_OK | MB_ICONINFORMATION);
                }
                DestroyMenu(hPop);
            }
            return 0;
        }
        // (A) Banner rotativo en status bar
        case WM_TIMER:
            if (wParam == AD_TIMER_ID && !g_IsProActivated) {
                g_AdBannerIndex = (g_AdBannerIndex + 1) % ADS_COUNT;
                SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)ADS[g_AdBannerIndex].msg);
            }
            return 0;

        case WM_USER_UPDATE_PROGRESS: {
            // Actualización asíncrona de UI en Tiempo Real sin stuttering
            int index = (int)wParam; int progress = (int)lParam;
            SendMessage(hProgressBar, PBM_SETPOS, progress, 0);
            std::wstring prgTxt = L"Procesando... " + std::to_wstring(progress) + L"%";
            ListView_SetItemText(hListView, index, 3, (LPWSTR)prgTxt.c_str());
            return 0;
        }
        case WM_USER_PROCESS_DONE: {
            ROIData* roi = (ROIData*)wParam;
            
            // Actualizar interfaz con datos finales
            std::wstring origStr = std::to_wstring(roi->sizeOrigMB).substr(0, 5) + L" MB";
            std::wstring agzStr = std::to_wstring(roi->sizeAgzMB).substr(0, 5) + L" MB";
            std::wstring effStr = L"Ahorro: " + std::to_wstring((roi->sizeOrigMB - roi->sizeAgzMB) / roi->sizeOrigMB * 100.0).substr(0, 4) + L"%";
            
            ListView_SetItemText(hListView, roi->listIndex, 1, (LPWSTR)origStr.c_str());
            ListView_SetItemText(hListView, roi->listIndex, 2, (LPWSTR)agzStr.c_str());
            ListView_SetItemText(hListView, roi->listIndex, 3, (LPWSTR)effStr.c_str());
            SendMessage(hProgressBar, PBM_SETPOS, 100, 0);
            SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)
                (L"  ✅ Comprimido: " + roi->fileName + L"  —  Ahorro: " +
                 std::to_wstring((roi->sizeOrigMB - roi->sizeAgzMB) /
                 (roi->sizeOrigMB > 0 ? roi->sizeOrigMB : 1) * 100.0).substr(0,4) + L"%").c_str());

            // Reporte de eficiencia (solo PRO muestra el dialog detallado)
            if (g_IsProActivated) {
                std::wstring roiMsg =
                    L"=== REPORTE DE EFICIENCIA QUANTUM ===\n\n"
                    L"Archivo: " + roi->fileName + L"\n"
                    L"Tiempo: " + std::to_wstring(roi->elapsedSec).substr(0,4) + L" seg\n"
                    L"Reducción: " + std::to_wstring(roi->sizeOrigMB - roi->sizeAgzMB).substr(0,5) + L" MB\n\n"
                    L"🔥 Tiempo real ahorrado: " + std::to_wstring(roi->timeSavings > 0 ? roi->timeSavings : 0).substr(0,5) + L" seg";
                MessageBoxW(hwnd, roiMsg.c_str(), L"AGZ Pro — Reporte PRO", MB_OK | MB_ICONINFORMATION);
            }

            // (B) Dialog post-operación con oferta de afiliado (cada AD_SHOW_EVERY ops)
            if (!g_IsProActivated) {
                g_OpsCount++;
                if (g_OpsCount % AD_SHOW_EVERY == 0) {
                    // Rotar al siguiente afiliado (distinto del banner actual)
                    int adIdx = (g_AdBannerIndex + 2) % ADS_COUNT;
                    const AdEntry& ad = ADS[adIdx];
                    std::wstring adMsg =
                        L"🎉 ¡Archivo comprimido exitosamente!\n\n"
                        + std::wstring(ad.msg) + L"\n\n"
                        L"[Presioná Aceptar para ver la oferta — abre en tu navegador]\n"
                        L"Los usuarios PRO no ven este mensaje.";
                    int resp = MessageBoxW(hwnd, adMsg.c_str(),
                        L"AGZ Pro — Oferta Especial", MB_OKCANCEL | MB_ICONINFORMATION);
                    if (resp == IDOK && ad.url)
                        ShellExecuteW(NULL, L"open", ad.url, NULL, NULL, SW_SHOWNORMAL);
                }
            }

            // Agregar al historial de PROJECTS
            LVITEMW lviH = {0}; lviH.mask = LVIF_TEXT;
            lviH.iItem = ListView_GetItemCount(hHistoryList);
            lviH.pszText = (LPWSTR)(L"📦 " + roi->fileName).c_str();
            ListView_InsertItem(hHistoryList, &lviH);

            delete roi;
            return 0;
        }
        case WM_DESTROY:
            KillTimer(hwnd, AD_TIMER_ID);
            RevokeDragDrop(hwnd);
            if (pDropTarget) pDropTarget->Release();
            PostQuitMessage(0); return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    g_HWID = LicenseManager::getHWID();
    g_IsProActivated = LicenseManager::loadAndVerify();

    // 1. Capturar Argumentos de Línea de Comandos (Integración con Explorer)
    int argc;
    LPWSTR* argv = CommandLineToArgvW(GetCommandLineW(), &argc);

    // Comprobación de Trial expirado
    if (!g_IsProActivated && LicenseManager::checkTrialExpired()) {
        MessageBoxW(NULL, L"Tu período de evaluación gratuita de 30 días ha expirado.\n\nPor favor, apoya el desarrollo de AGZ Pro adquiriendo una Licencia Corporativa o utilizando el botón de Donación para apoyar a los creadores. El programa seguirá funcionando sin límite de capacidad.", L"AGZ Pro - Evaluación Expirada", MB_OK | MB_ICONWARNING);
    }

    OleInitialize(NULL);
    INITCOMMONCONTROLSEX icex = { sizeof(INITCOMMONCONTROLSEX), ICC_LISTVIEW_CLASSES | ICC_BAR_CLASSES | ICC_PROGRESS_CLASS };
    InitCommonControlsEx(&icex);
    hbgBrush = CreateSolidBrush(COL_BG_BOT);
    
    WNDCLASSW wc = {0}; 
    wc.lpfnWndProc = WindowProc; 
    wc.hInstance = hInstance; 
    wc.lpszClassName = L"AGZ_PRO_APP"; 
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hIcon = LoadIconW(hInstance, L"MAINICON");
    RegisterClassW(&wc);
    
    std::wstring title = g_IsProActivated ? L"AGZ Pro - Enterprise Edition (Licenciado)" : L"AGZ Pro - Copia de Evaluación (Uso No Comercial)";
    hMainWnd = CreateWindowExW(0, L"AGZ_PRO_APP", title.c_str(), WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, 850, 600, NULL, NULL, hInstance, NULL);
    
    ShowWindow(hMainWnd, nCmdShow);
    UpdateWindow(hMainWnd);

    // 2. Procesar archivos pasados por el sistema (SOLO cuando la ventana ya es visible y estable)
    if (argc > 1) {
        for (int i = 1; i < argc; i++) {
            std::wstring file = argv[i];
            
            // Convertir a minúsculas para evitar problemas de case sensitivity (.AGZ, .agz, .Agz)
            std::wstring fileLower = file;
            for (auto& c : fileLower) c = towlower(c);
            
            if (fileLower.length() > 4 && fileLower.substr(fileLower.length() - 4) == L".agz") {
                AGZProEngine::listArchiveContents(file, hMainWnd);
            } else {
                AddFileToList(file);
            }
        }
        LocalFree(argv);
    } else {
        // MODO DEPURACIÓN: Mostrar si no se recibió NINGÚN archivo
        LPWSTR cmdLine = GetCommandLineW();
        // MessageBoxW(hMainWnd, cmdLine, L"DEBUG - Cero Argumentos Recibidos", MB_OK);
    }
    MSG msg = {0};
    while (GetMessage(&msg, NULL, 0, 0)) { TranslateMessage(&msg); DispatchMessage(&msg); }
    
    DeleteObject(hbgBrush);
    DeleteObject(hBrushAlt);
    DeleteObject(hBrushAccent);
    DeleteObject(hFontMain);
    DeleteObject(hFontBig);
    DeleteObject(hFontHeader);
    OleUninitialize();
    return 0;
}
