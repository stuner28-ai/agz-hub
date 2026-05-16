import sys
import os
import struct
import zlib
import xxhash
import time
import webbrowser
import tkinter as tk
from tkinter import messagebox, filedialog

def iniciar_extractor_universal():
    root = tk.Tk()
    root.withdraw() 

    # Esto abrirá el explorador de Windows para que elijas el .agz
    ruta_paquete = filedialog.askopenfilename(
        title="Seleccionar paquete AGZ para extraer",
        filetypes=[("Archivos AGZ", "*.agz"), ("Todos los archivos", "*.*")]
    )

    if not ruta_paquete:
        root.destroy()
        return 

    try:
        inicio_tiempo = time.time()
        directorio_destino = os.path.dirname(ruta_paquete)

        with open(ruta_paquete, "rb") as f:
            header_fijo = f.read(21)
            magic_number = header_fijo[:4]
            if magic_number != b'\x41\x47\x5A\x21':
                raise ValueError("El archivo no es un formato AGZ válido.")

            tamano_original, firma_guardada = struct.unpack(">Q8s", header_fijo[5:21])
            len_nombre = struct.unpack(">H", f.read(2))[0]
            nombre_archivo = f.read(len_nombre).decode('utf-8')
            
            datos_descomprimidos = zlib.decompress(f.read())

        if xxhash.xxh64(datos_descomprimidos).digest() != firma_guardada:
            messagebox.showerror("Error", "Fallo de integridad xxHash64.")
            return

        ruta_destino = os.path.join(directorio_destino, nombre_archivo)
        with open(ruta_destino, "wb") as f:
            f.write(datos_descomprimidos)

        mensaje = f"Archivo '{nombre_archivo}' restaurado en {round(time.time() - inicio_tiempo, 4)}s.\n\n¿Descargar versión Pro?"
        if messagebox.askyesno("Éxito", mensaje):
            webbrowser.open("https://github.com")

    except Exception as e:
        messagebox.showerror("Error", f"Fallo técnico: {str(e)}")
    finally:
        root.destroy()

if __name__ == "__main__":
    iniciar_extractor_universal()