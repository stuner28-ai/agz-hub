/*==============================================================================
  AGZ Pro - Módulo Visual: Quantum Tech v2
  Diseño de Alto Impacto. Win32 API Puro.
==============================================================================*/
#include <windows.h>
#include <commctrl.h>
#include <shellapi.h>
#include <oleidl.h>
#include <uxtheme.h>
#include <string>

#pragma comment(linker, "\"/manifestdependency:type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'\"")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "uxtheme.lib")
#pragma comment(lib, "msimg32.lib")
#pragma comment(lib, "dwmapi.lib")
#include <dwmapi.h>

// ── Paleta Quantum Tech v2 ────────────────────────────────────────────────────
#define COL_BG          RGB(10,  25,  47)   // #0A192F  Azul Abisal
#define COL_BG_ALT      RGB(17,  34,  64)   // #112240  Fila impar (sutil)
#define COL_ACCENT      RGB(230, 57,  70)   // #E63946  Carmesí Energético
#define COL_TEXT        RGB(241, 250, 238)  // #F1FAEE  Blanco Humo
#define COL_TEXT_SEC    RGB(141, 153, 174)  // #8D99AE  Gris Atenuado
#define COL_SEL         RGB(45,  15,  25)   // Carmesí Suave (Selección)
#define COL_GOLD        RGB(234, 179, 8)    // Dorado PRO

static HWND   hMainWnd, hListView, hToolBar, hStatusBar;
static HBRUSH hBrushBG, hBrushAlt, hBrushAccent;
static HFONT  hFontUI, hFontHeader;
static HIMAGELIST hImgListRows = nullptr;

// ── 1. Fuente Global (10.5pt ≈ 14px @96dpi, Segoe UI Variable Text) ──────────
static void InitFonts() {
    // 10.5pt: nHeight = -MulDiv(10.5, GetDeviceCaps(DC,LOGPIXELSY), 72)
    HDC hdc = GetDC(NULL);
    int pxMain   = -MulDiv(105, GetDeviceCaps(hdc, LOGPIXELSY), 720); // 10.5pt
    int pxHeader = -MulDiv(90,  GetDeviceCaps(hdc, LOGPIXELSY), 720); // 9pt
    ReleaseDC(NULL, hdc);

    hFontUI = CreateFontW(pxMain, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI Variable Text");
    if (!hFontUI)
        hFontUI = CreateFontW(pxMain, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");

    hFontHeader = CreateFontW(pxHeader, 0, 0, 0, FW_SEMIBOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI Semibold");
    if (!hFontHeader)
        hFontHeader = CreateFontW(pxHeader, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
}

// ── IDropTarget minimal (lógica real delegada al motor) ───────────────────────
class CDropTarget : public IDropTarget {
    LONG ref = 1; HWND wnd;
public:
    CDropTarget(HWND h) : wnd(h) {}
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID r, void** p) override {
        if (r == IID_IUnknown || r == IID_IDropTarget) { *p = this; AddRef(); return S_OK; }
        *p = NULL; return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef()  override { return InterlockedIncrement(&ref); }
    ULONG STDMETHODCALLTYPE Release() override {
        LONG c = InterlockedDecrement(&ref); if (!c) delete this; return c;
    }
    HRESULT STDMETHODCALLTYPE DragEnter(IDataObject*, DWORD, POINTL, DWORD* e) override { *e = DROPEFFECT_COPY; return S_OK; }
    HRESULT STDMETHODCALLTYPE DragOver(DWORD, POINTL, DWORD* e)               override { *e = DROPEFFECT_COPY; return S_OK; }
    HRESULT STDMETHODCALLTYPE DragLeave()                                      override { return S_OK; }
    HRESULT STDMETHODCALLTYPE Drop(IDataObject*, DWORD, POINTL, DWORD* e)     override { *e = DROPEFFECT_COPY; return S_OK; }
};

// ── 2 & 4. Pintar Header del ListView con fondo Abisal ────────────────────────
static void PaintHeader(HWND hHeader, LPNMCUSTOMDRAW cd) {
    HBRUSH br = CreateSolidBrush(COL_BG);
    FillRect(cd->hdc, &cd->rc, br);
    DeleteObject(br);

    // Texto de cabecera
    wchar_t text[128] = {};
    HDITEM hi = {}; hi.mask = HDI_TEXT; hi.pszText = text; hi.cchTextMax = 127;
    Header_GetItem(hHeader, (int)cd->dwItemSpec, &hi);

    SetBkMode(cd->hdc, TRANSPARENT);
    SetTextColor(cd->hdc, COL_TEXT);
    HFONT old = (HFONT)SelectObject(cd->hdc, hFontHeader);
    RECT rc = cd->rc; rc.left += 8;
    DrawTextW(cd->hdc, text, -1, &rc, DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    SelectObject(cd->hdc, old);

    // Línea separadora sutil (Carmesí muy tenue)
    HPEN pen = CreatePen(PS_SOLID, 1, RGB(40, 60, 90));
    HPEN op = (HPEN)SelectObject(cd->hdc, pen);
    MoveToEx(cd->hdc, cd->rc.right - 1, cd->rc.top + 4, NULL);
    LineTo(cd->hdc, cd->rc.right - 1, cd->rc.bottom - 4);
    SelectObject(cd->hdc, op);
    DeleteObject(pen);
}

// ── CreateControls ────────────────────────────────────────────────────────────
static void CreateControls(HWND hwnd) {

    // ── 4. Toolbar FLAT, sin divisor, sin bordes ─────────────────────────────
    hToolBar = CreateWindowExW(0, TOOLBARCLASSNAMEW, NULL,
        WS_CHILD | WS_VISIBLE | TBSTYLE_FLAT | TBSTYLE_LIST |
        TBSTYLE_TRANSPARENT | CCS_NODIVIDER | CCS_NOPARENTALIGN,
        0, 0, 0, 52, hwnd, (HMENU)1, GetModuleHandle(NULL), NULL);
    SendMessage(hToolBar, TB_BUTTONSTRUCTSIZE, sizeof(TBBUTTON), 0);
    SendMessage(hToolBar, WM_SETFONT, (WPARAM)hFontUI, TRUE);
    SetWindowTheme(hToolBar, L" ", L" "); // Eliminar estilos visuales de sistema

    TBBUTTON tbb[] = {
        {I_IMAGENONE, 101, TBSTATE_ENABLED, BTNS_SHOWTEXT|BTNS_AUTOSIZE, {}, 0, (INT_PTR)L"  ✚  AÑADIR  " },
        {I_IMAGENONE, 102, TBSTATE_ENABLED, BTNS_SHOWTEXT|BTNS_AUTOSIZE, {}, 0, (INT_PTR)L"  ⇊  EXTRAER  "},
        {I_IMAGENONE, 107, TBSTATE_ENABLED, BTNS_SHOWTEXT|BTNS_AUTOSIZE, {}, 0, (INT_PTR)L"  ▣  VOLS  "   },
        {I_IMAGENONE, 103, TBSTATE_ENABLED, BTNS_SHOWTEXT|BTNS_AUTOSIZE, {}, 0, (INT_PTR)L"  🔑  CIFRAR  " },
        {I_IMAGENONE, 105, TBSTATE_ENABLED, BTNS_SHOWTEXT|BTNS_AUTOSIZE, {}, 0, (INT_PTR)L"  💎  PRO  "   },
        {I_IMAGENONE, 106, TBSTATE_ENABLED, BTNS_SHOWTEXT|BTNS_AUTOSIZE, {}, 0, (INT_PTR)L"  ♥  DONAR  "  },
    };
    SendMessage(hToolBar, TB_ADDBUTTONS, ARRAYSIZE(tbb), (LPARAM)tbb);
    SendMessage(hToolBar, TB_AUTOSIZE, 0, 0);

    // ── 3. ListView: 32px rows + doble buffer ────────────────────────────────
    hListView = CreateWindowExW(0, WC_LISTVIEWW, NULL,
        WS_CHILD | WS_VISIBLE | LVS_REPORT | LVS_SHOWSELALWAYS | LVS_OWNERDATA,
        0, 52, 900, 550, hwnd, (HMENU)2, GetModuleHandle(NULL), NULL);

    ListView_SetExtendedListViewStyle(hListView,
        LVS_EX_FULLROWSELECT | LVS_EX_DOUBLEBUFFER);

    // Truco: ImageList invisible de 32px de alto para forzar altura de fila
    hImgListRows = ImageList_Create(1, 32, ILC_COLOR32, 0, 1);
    ListView_SetImageList(hListView, hImgListRows, LVSIL_SMALL);

    // Tema oscuro nativo del Explorador de Windows 11
    SetWindowTheme(hListView, L"DarkMode_Explorer", NULL);

    // Colores base del control
    ListView_SetBkColor(hListView, COL_BG);
    ListView_SetTextBkColor(hListView, COL_BG);
    ListView_SetTextColor(hListView, COL_TEXT);

    // Fuente
    SendMessage(hListView, WM_SETFONT, (WPARAM)hFontUI, TRUE);

    // Eliminar el tema visual del header para poder pintarlo manualmente
    HWND hHeader = ListView_GetHeader(hListView);
    SetWindowTheme(hHeader, L" ", L" ");
    SendMessage(hHeader, WM_SETFONT, (WPARAM)hFontHeader, TRUE);

    // Columnas
    struct ColDef { const wchar_t* label; int width; } cols[] = {
        {L"Archivo de Datos",  300},
        {L"Tamaño",           140},
        {L"Estado",           160},
        {L"Ratio ROI",        140},
    };
    LVCOLUMNW lvc = {}; lvc.mask = LVCF_TEXT | LVCF_WIDTH | LVCF_SUBITEM;
    for (int i = 0; i < 4; i++) {
        lvc.iSubItem = i; lvc.cx = cols[i].width;
        lvc.pszText = (LPWSTR)cols[i].label;
        ListView_InsertColumn(hListView, i, &lvc);
    }

    // ── Barra de estado ──────────────────────────────────────────────────────
    hStatusBar = CreateWindowExW(0, STATUSCLASSNAMEW, NULL,
        WS_CHILD | WS_VISIBLE, 0, 0, 0, 0, hwnd, (HMENU)9, GetModuleHandle(NULL), NULL);
    SendMessage(hStatusBar, SB_SETTEXTW, 0, (LPARAM)L"  AGZ Pro · Quantum Tech v2 · Listo.");

    // OLE Drag & Drop
    RegisterDragDrop(hwnd, new CDropTarget(hwnd));
}

// ── WindowProc ─────────────────────────────────────────────────────────────────
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {

    case WM_CREATE:
        CreateControls(hwnd);
        // Modo Oscuro Inmersivo nativo de Windows 11
        {
            BOOL dark = TRUE;
            DwmSetWindowAttribute(hwnd, 20, &dark, sizeof(dark)); // DWMWA_USE_IMMERSIVE_DARK_MODE
        }
        return 0;

    case WM_SIZE: {
        WORD w = LOWORD(lParam), h = HIWORD(lParam);
        SendMessage(hToolBar, TB_AUTOSIZE, 0, 0);
        RECT tbrc{}; GetWindowRect(hToolBar, &tbrc);
        int tbh = tbrc.bottom - tbrc.top;

        RECT sbrc{}; GetWindowRect(hStatusBar, &sbrc);
        int sbh = sbrc.bottom - sbrc.top;
        SendMessage(hStatusBar, WM_SIZE, 0, 0);

        MoveWindow(hListView, 0, tbh, w, h - tbh - sbh, TRUE);
        return 0;
    }

    // ── 1. Anti-Flicker: Fondo Azul Abisal ───────────────────────────────────
    case WM_ERASEBKGND: {
        RECT rc; GetClientRect(hwnd, &rc);
        FillRect((HDC)wParam, &rc, hBrushBG);
        return 1; // Decir a Windows: "ya lo pinté, no hagas nada más"
    }

    case WM_NOTIFY: {
        LPNMHDR nm = (LPNMHDR)lParam;

        // ── 4. Toolbar: Hover Carmesí, fondo transparente ─────────────────────
        if (nm->hwndFrom == hToolBar && nm->code == NM_CUSTOMDRAW) {
            LPNMTBCUSTOMDRAW cd = (LPNMTBCUSTOMDRAW)lParam;

            if (cd->nmcd.dwDrawStage == CDDS_PREPAINT)
                return CDRF_NOTIFYITEMDRAW;

            if (cd->nmcd.dwDrawStage == CDDS_ITEMPREPAINT) {
                bool hot = (cd->nmcd.uItemState & CDIS_HOT) != 0;

                // Fondo
                HBRUSH bg = hot ? hBrushAccent : hBrushBG;
                FillRect(cd->nmcd.hdc, &cd->nmcd.rc, bg);

                // Texto
                cd->clrText    = hot ? RGB(255, 255, 255) : COL_TEXT_SEC;
                cd->clrBtnFace = hot ? COL_ACCENT : COL_BG;
                // TBCDRF_NOEDGES = no bordes, TBCDRF_USECDCOLORS = usar nuestros colores
                return TBCDRF_NOEDGES | TBCDRF_USECDCOLORS;
            }
        }

        // ── 2 & 3. ListView + Header NM_CUSTOMDRAW ───────────────────────────
        if (nm->hwndFrom == hListView && nm->code == NM_CUSTOMDRAW) {
            LPNMLVCUSTOMDRAW cd = (LPNMLVCUSTOMDRAW)lParam;
            switch (cd->nmcd.dwDrawStage) {
            case CDDS_PREPAINT:     return CDRF_NOTIFYITEMDRAW;
            case CDDS_ITEMPREPAINT: return CDRF_NOTIFYSUBITEMDRAW;
            case CDDS_ITEMPREPAINT | CDDS_SUBITEM: {
                bool sel  = (cd->nmcd.uItemState & CDIS_SELECTED) != 0;
                bool odd  = (cd->nmcd.dwItemSpec % 2) != 0;

                cd->clrText    = sel ? COL_TEXT : (odd ? COL_TEXT : COL_TEXT);
                cd->clrTextBk  = sel ? COL_SEL  : (odd ? COL_BG_ALT : COL_BG);
                return CDRF_DODEFAULT;
            }
            }
        }

        // ── 2. Header del ListView (pintado manual plano) ─────────────────────
        HWND hHeader = ListView_GetHeader(hListView);
        if (nm->hwndFrom == hHeader && nm->code == NM_CUSTOMDRAW) {
            LPNMCUSTOMDRAW cd = (LPNMCUSTOMDRAW)lParam;
            if (cd->dwDrawStage == CDDS_PREPAINT)
                return CDRF_NOTIFYITEMDRAW;
            if (cd->dwDrawStage == CDDS_ITEMPREPAINT) {
                PaintHeader(hHeader, cd);
                return CDRF_SKIPDEFAULT; // Nosotros pintamos todo
            }
        }
        break;
    }

    case WM_CTLCOLORSTATIC:
    case WM_CTLCOLOREDIT: {
        HDC hdc = (HDC)wParam;
        SetBkColor(hdc, COL_BG);
        SetTextColor(hdc, COL_TEXT);
        return (LRESULT)hBrushBG;
    }

    case WM_DESTROY:
        RevokeDragDrop(hwnd);
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

// ── Entry Point ───────────────────────────────────────────────────────────────
int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int nCmdShow) {
    OleInitialize(NULL);
    INITCOMMONCONTROLSEX icex = { sizeof(icex), ICC_LISTVIEW_CLASSES | ICC_BAR_CLASSES | ICC_STATUS_CLASSES };
    InitCommonControlsEx(&icex);

    // Fuentes
    InitFonts();

    // Pinceles
    hBrushBG     = CreateSolidBrush(COL_BG);
    hBrushAlt    = CreateSolidBrush(COL_BG_ALT);
    hBrushAccent = CreateSolidBrush(COL_ACCENT);

    // Clase de Ventana
    WNDCLASSEXW wc    = {};
    wc.cbSize         = sizeof(wc);
    wc.lpfnWndProc    = WindowProc;
    wc.hInstance      = hInst;
    wc.lpszClassName  = L"AGZ_QT2";
    wc.hCursor        = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground  = hBrushBG;   // Fondo abisal incluso antes del WM_ERASEBKGND
    wc.hIcon          = LoadIconW(hInst, L"MAINICON");
    RegisterClassExW(&wc);

    hMainWnd = CreateWindowExW(0, L"AGZ_QT2",
        L"AGZ Pro - Quantum Tech v2",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 960, 660,
        NULL, NULL, hInst, NULL);

    ShowWindow(hMainWnd, nCmdShow);
    UpdateWindow(hMainWnd);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    // Limpieza
    DeleteObject(hBrushBG);
    DeleteObject(hBrushAlt);
    DeleteObject(hBrushAccent);
    DeleteObject(hFontUI);
    DeleteObject(hFontHeader);
    if (hImgListRows) ImageList_Destroy(hImgListRows);
    OleUninitialize();
    return (int)msg.wParam;
}
