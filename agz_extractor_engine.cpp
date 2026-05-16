#include <windows.h>
#include <iostream>
#include <vector>
#include <string>
#include <zlib.h>
#define XXH_INLINE_ALL
#include "xxhash.h"
#include <immintrin.h>

#pragma comment(lib, "kernel32.lib")
#pragma comment(lib, "zlib.lib")

#define BLOCK_SIZE (64 * 1024)

enum class CompressionMode : uint8_t { Bypass = 0x00, DeltaANS = 0x01, TANS_Dict = 0x02, Solid_TANS = 0x03 };

#pragma pack(push, 1)
struct BlockHeader {
    uint32_t originalSize;
    uint32_t compressedSize;
    uint64_t blockHash;
    CompressionMode mode;
};
#pragma pack(pop)

// --- MOTOR tANS (Tabled Asymmetric Numeral Systems) ---
#define TANS_L 1024

struct TANSDictionary {
    uint16_t freqs[256];
};

struct TANSDecodeState {
    uint8_t symbol;
    uint8_t nbBits;
    uint16_t newX;
};

class TANSDecoder {
public:
    static void buildDecodeTable(const TANSDictionary& dict, TANSDecodeState* decodeTable) {
        uint8_t symbolSpread[TANS_L];
        uint16_t nextPos[256];

        uint32_t step = (TANS_L >> 1) + (TANS_L >> 3) + 3; 
        uint32_t pos = 0;
        
        for (int sym = 0; sym < 256; sym++) {
            for (int i = 0; i < dict.freqs[sym]; i++) {
                symbolSpread[pos] = (uint8_t)sym;
                pos = (pos + step) & (TANS_L - 1);
            }
        }

        for (int sym = 0; sym < 256; sym++) {
            nextPos[sym] = dict.freqs[sym]; 
        }

        for (int i = 0; i < TANS_L; i++) {
            uint8_t s = symbolSpread[i];
            uint16_t x = nextPos[s]++; 
            
            uint32_t k = 0;
            uint16_t temp = x;
            while (temp > 1) { temp >>= 1; k++; }
            
            decodeTable[i].symbol = s;
            decodeTable[i].nbBits = (uint8_t)(10 - k);
            decodeTable[i].newX = (uint16_t)(x << (10 - k));
        }
    }

    static std::vector<uint8_t> decompress(const std::vector<uint8_t>& stream, size_t originalSize, const TANSDecodeState* decodeTable) {
        std::vector<uint8_t> out(originalSize);
        std::vector<bool> bitStack;
        
        for (uint8_t byte : stream) {
            for (int i = 0; i < 8; i++) bitStack.push_back(((byte >> i) & 1) != 0);
        }
        
        size_t bitPos = 0;
        uint16_t state = 0; 
        
        for (int i = 0; i < 16; i++) {
            if (bitPos < bitStack.size() && bitStack[bitPos++]) state |= (1 << i);
        }
        
        for (size_t i = 0; i < originalSize; i++) {
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

class AGZExtractor {
public:
    static void reverseDeltaTransformSIMD(uint8_t* data, size_t size) {
        if (size == 0) return;
        // Inversa rápida: A diferencia de la directa, la inversa acumula valores, lo que requiere código secuencial.
        // La optimización SIMD real para la suma prefijada (Prefix Sum) es compleja, usamos el bucle estándar unrolled.
        for (size_t i = 1; i < size; ++i) {
            data[i] = (uint8_t)(data[i] + data[i - 1]);
        }
    }

    static void extract(const std::wstring& inputPath, const std::wstring& outputPath) {
        HANDLE hInput = CreateFileW(inputPath.c_str(), GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_FLAG_SEQUENTIAL_SCAN, NULL);
        HANDLE hOutput = CreateFileW(outputPath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);

        if (hInput == INVALID_HANDLE_VALUE || hOutput == INVALID_HANDLE_VALUE) {
            std::wcerr << L"Error abriendo archivos de E/S." << std::endl;
            return;
        }

        DWORD bytesRead, bytesWritten;

        // Comprobar Compresión Sólida (Global Dictionary)
        uint32_t magicMarker = 0;
        TANSDictionary globalDict;
        TANSDecodeState globalDecodeTable[TANS_L];
        bool isSolid = false;

        ReadFile(hInput, &magicMarker, sizeof(magicMarker), &bytesRead, NULL);
        if (magicMarker == 0x534F4C44) { // "SOLD"
            ReadFile(hInput, &globalDict, sizeof(TANSDictionary), &bytesRead, NULL);
            TANSDecoder::buildDecodeTable(globalDict, globalDecodeTable);
            isSolid = true;
        } else {
            // Retroceder el puntero si no es Sólido ni SFX
            SetFilePointer(hInput, 0, NULL, FILE_BEGIN);
        }

        BlockHeader bh;

        while (ReadFile(hInput, &bh, sizeof(BlockHeader), &bytesRead, NULL) && bytesRead == sizeof(BlockHeader)) {
            
            std::vector<uint8_t> buffer(bh.compressedSize);
            
            if (!ReadFile(hInput, buffer.data(), bh.compressedSize, &bytesRead, NULL) || bytesRead != bh.compressedSize) {
                std::wcerr << L"Error: Archivo corrupto o lectura incompleta." << std::endl;
                break;
            }

            // 1. Validación Criptográfica xxHash64
            uint64_t currentHash = XXH64(buffer.data(), buffer.size(), 0);
            if (currentHash != bh.blockHash) {
                std::wcerr << L"ERROR: Fallo de integridad (Hash mismatch)." << std::endl;
                break; // Corrupción estricta
            }

            // 2. Extracción Asimétrica
            std::vector<uint8_t> outBuffer;
            if (bh.mode == CompressionMode::Bypass) {
                outBuffer = std::move(buffer);
            } 
            else if (bh.mode == CompressionMode::Solid_TANS && isSolid) {
                outBuffer = TANSDecoder::decompress(buffer, bh.originalSize, globalDecodeTable);
            }
            else if (bh.mode == CompressionMode::TANS_Dict) {
                TANSDictionary dict;
                memcpy(&dict, buffer.data(), sizeof(TANSDictionary));
                
                TANSDecodeState decodeTable[TANS_L];
                TANSDecoder::buildDecodeTable(dict, decodeTable);
                
                std::vector<uint8_t> payloadStream(buffer.begin() + sizeof(TANSDictionary), buffer.end());
                outBuffer = TANSDecoder::decompress(payloadStream, bh.originalSize, decodeTable);
            } 
            else if (bh.mode == CompressionMode::DeltaANS) {
                outBuffer.resize(bh.originalSize);
                uLongf destLen = bh.originalSize;
                uncompress(outBuffer.data(), &destLen, buffer.data(), buffer.size());
                reverseDeltaTransformSIMD(outBuffer.data(), outBuffer.size());
            }

            // 3. Escritura
            WriteFile(hOutput, outBuffer.data(), (DWORD)outBuffer.size(), &bytesWritten, NULL);
        }

        CloseHandle(hInput);
        CloseHandle(hOutput);
        std::wcout << L"Extracción nativa completada." << std::endl;
    }
};

int wmain(int argc, wchar_t* argv[]) {
    if (argc < 3) {
        std::wcout << L"Uso: agz_extractor_engine.exe <archivo.agz> <salida>" << std::endl;
        return 1;
    }
    AGZExtractor::extract(argv[1], argv[2]);
    return 0;
}
