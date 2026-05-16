#include "agz_handler.hpp"
#include <iomanip>

/**
 * Ejemplo de uso del motor AGZ en C++
 * Para compilar en Windows: g++ main.cpp -o agz_tool.exe -lws2_32
 */

void imprimir_resumen(const AGZHeader& h, const std::string& name) {
    std::cout << "--- Resumen Tecnico AGZ ---" << std::endl;
    std::cout << "Magic:    0x" << std::hex << std::uppercase << AGZHandler::MAGIC << std::dec << std::endl;
    std::cout << "Version:  " << (int)h.version << std::endl;
    std::cout << "Tamaño:   " << h.originalSize << " bytes" << std::endl;
    std::cout << "Nombre:   " << name << std::endl;
    std::cout << "Hash:     ";
    for(int i=0; i<8; ++i) std::cout << std::setw(2) << std::setfill('0') << std::hex << (int)h.hash[i];
    std::cout << std::dec << std::endl;
    std::cout << "---------------------------" << std::endl;
}

int main() {
    // 1. Simulación de creación de un paquete
    std::string mockFileName = "documento.txt";
    std::string mockContent = "Contenido comprimido de prueba";
    std::vector<uint8_t> mockData(mockContent.begin(), mockContent.end());
    uint8_t mockHash[8] = {0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE};
    uint64_t originalSize = 1024512;

    std::cout << "Generando paquete_test.agz..." << std::endl;
    if (AGZHandler::save("paquete_test.agz", mockFileName, mockData, originalSize, mockHash)) {
        std::cout << "¡Éxito! Paquete generado." << std::endl;
    }

    // 2. Lectura y verificación del encabezado
    std::ifstream fileIn("paquete_test.agz", std::ios::binary);
    AGZHeader readHeader;
    std::string readName;

    if (fileIn.is_open() && AGZHandler::loadHeader(fileIn, readHeader, readName)) {
        imprimir_resumen(readHeader, readName);
    } else {
        std::cerr << "Error al leer el encabezado." << std::endl;
    }

    return 0;
}
