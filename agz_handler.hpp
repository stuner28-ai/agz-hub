#pragma once

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <cstdint>
#include <cstring>

#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <arpa/inet.h>
#endif

// Nota: Requiere vincular con zlib y xxhash
// #include <zlib.h>
// #include <xxhash.h>

#pragma pack(push, 1)
struct AGZHeader {
    uint32_t magic;          // 0x41475A21 (Big Endian)
    uint8_t  version;        // 0x01
    uint64_t originalSize;   // Big Endian
    uint8_t  hash[8];        // xxHash64 Digest
    uint16_t nameLength;     // Big Endian
};
#pragma pack(pop)

/**
 * @brief Utilidades para conversión de Endianness (Host to Network / Big Endian)
 */
inline uint64_t htonll_agz(uint64_t value) {
    static const int num = 42;
    if (*(const char*)&num == 42) { // Little Endian host
        return ((uint64_t)htonl(value & 0xFFFFFFFF) << 32) | htonl(value >> 32);
    }
    return value;
}

inline uint64_t ntohll_agz(uint64_t value) {
    return htonll_agz(value);
}

class AGZHandler {
public:
    static constexpr uint32_t MAGIC = 0x41475A21;
    static constexpr uint8_t VERSION = 0x01;

    /**
     * @brief Genera un archivo .agz replicando la lógica de Python.
     */
    static bool save(const std::string& outputPath, 
                    const std::string& fileName,
                    const std::vector<uint8_t>& compressedData,
                    uint64_t originalSize,
                    const uint8_t* xxh64Digest) {
        
        std::ofstream file(outputPath, std::ios::binary);
        if (!file.is_open()) return false;

        AGZHeader header;
        header.magic = htonl(MAGIC);
        header.version = VERSION;
        header.originalSize = htonll_agz(originalSize);
        std::memcpy(header.hash, xxh64Digest, 8);
        header.nameLength = htons(static_cast<uint16_t>(fileName.size()));

        file.write(reinterpret_cast<const char*>(&header), sizeof(header));
        file.write(fileName.c_str(), fileName.size());
        file.write(reinterpret_cast<const char*>(compressedData.data()), compressedData.size());

        return true;
    }

    /**
     * @brief Lee y valida el encabezado de un archivo .agz.
     */
    static bool loadHeader(std::ifstream& file, AGZHeader& outHeader, std::string& outFileName) {
        if (!file.read(reinterpret_cast<char*>(&outHeader), sizeof(AGZHeader))) return false;

        // Validar Magic Number
        if (ntohl(outHeader.magic) != MAGIC) {
            return false;
        }

        // Convertir campos de Big Endian a Host
        outHeader.originalSize = ntohll_agz(outHeader.originalSize);
        uint16_t nameLen = ntohs(outHeader.nameLength);

        std::vector<char> nameBuf(nameLen);
        if (!file.read(nameBuf.data(), nameLen)) return false;
        outFileName.assign(nameBuf.data(), nameLen);

        return true;
    }
};
