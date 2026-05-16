import struct
import os

def inspeccionar_agz(ruta_archivo):
    if not os.path.exists(ruta_archivo):
        print(f"Error: No se encuentra el archivo {ruta_archivo}")
        return

    print(f"--- Inspeccionando {ruta_archivo} ---")
    
    with open(ruta_archivo, "rb") as f:
        # 1. Leer encabezado fijo (21 bytes)
        # I=uint32 (4), B=uint8 (1), Q=uint64 (8), 8s=bytes (8)
        # > significa Big-Endian
        header_data = f.read(21)
        if len(header_data) < 21:
            print("Error: El archivo es demasiado corto para tener un encabezado AGZ.")
            return

        magic, version, size, xxh64 = struct.unpack(">IBQ8s", header_data)

        # 2. Validar Magic Number (0x41475A21)
        if magic != 0x41475A21:
            print(f"Error: Magic Number invalido (0x{magic:08X}). No es un archivo AGZ.")
            return

        # 3. Leer longitud del nombre (2 bytes)
        name_len_data = f.read(2)
        name_len = struct.unpack(">H", name_len_data)[0]

        # 4. Leer nombre (UTF-8)
        name = f.read(name_len).decode("utf-8")

        # Mostrar resultados
        print(f"Magic Number:    0x{magic:08X} (OK)")
        print(f"Version:         {version}")
        print(f"Tamaño Original: {size} bytes")
        print(f"Hash xxHash64:   {xxh64.hex()}")
        print(f"Nombre Archivo:  {name}")
        print("-" * 30)
        print("RESULTADO: El encabezado es compatible con la especificacion C++.")

if __name__ == "__main__":
    inspeccionar_agz("paquete.agz")
