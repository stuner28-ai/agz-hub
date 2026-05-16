"""
AGZ Core: motor de empaquetado (xxHash64 + zlib + cabecera con nombre UTF-8).
Hito 9: interfaz gráfica tkinter para seleccionar archivo y generar paquete.agz.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

import tkinter as tk
from tkinter import filedialog, messagebox

import xxhash

MAGIC_AGZ = 0x41475A21
VERSION_FORMATO = 0x01


def tamano_en_bytes(ruta: Path) -> int:
    """Tamaño del archivo en bytes según el sistema de archivos."""
    return ruta.stat().st_size


def leer_contenido_exacto(ruta: Path) -> bytes:
    """Lee el archivo en binario, sin transformaciones."""
    return ruta.read_bytes()


def calcular_xxhash64(contenido: bytes) -> bytes:
    """Digest xxHash64 (8 bytes)."""
    return xxhash.xxh64(contenido).digest()


def comprimir_zlib(contenido: bytes) -> bytes:
    """Comprime con zlib (DEFLATE)."""
    return zlib.compress(contenido)


def escribir_paquete_agz(
    ruta_salida: Path,
    tamano_original: int,
    firma_xxh64: bytes,
    nombre_archivo_utf8: bytes,
    payload_zlib: bytes,
) -> None:
    """
    Cabecera: magic (4) + versión (1) + tamaño original (8) + xxHash64 (8)
    + longitud nombre UTF-8 (2, >H) + nombre (UTF-8) + cuerpo zlib.
    """
    if tamano_original < 0:
        raise ValueError("El tamaño no puede ser negativo.")
    if len(firma_xxh64) != 8:
        raise ValueError("La firma xxHash64 debe tener 8 bytes.")
    lon = len(nombre_archivo_utf8)
    if lon > 0xFFFF:
        raise ValueError("El nombre en UTF-8 supera 65535 bytes.")

    cabecera = (
        struct.pack(
            ">IBQ",
            MAGIC_AGZ,
            VERSION_FORMATO,
            tamano_original,
        )
        + firma_xxh64
        + struct.pack(">H", lon)
        + nombre_archivo_utf8
    )
    ruta_salida.write_bytes(cabecera + payload_zlib)


def empaquetar_archivo(entrada: Path) -> tuple[str, float, float, float]:
    """
    Lee, firma, comprime y escribe paquete.agz junto al archivo original.

    Devuelve (nombre_original, kb_origen, kb_paquete, porcentaje_ahorrado).
    El porcentaje compara el tamaño total del .agz frente al original.
    """
    entrada = entrada.expanduser().resolve()
    if not entrada.is_file():
        raise ValueError("La ruta no es un archivo válido.")

    nombre_archivo = entrada.name
    nombre_utf8 = nombre_archivo.encode("utf-8")

    bytes_origen = tamano_en_bytes(entrada)
    contenido = leer_contenido_exacto(entrada)
    if len(contenido) != bytes_origen:
        raise ValueError("Tamaño en disco distinto a los bytes leídos.")

    firma = calcular_xxhash64(contenido)
    payload = comprimir_zlib(contenido)

    ruta_paquete = entrada.parent / "paquete.agz"
    escribir_paquete_agz(ruta_paquete, bytes_origen, firma, nombre_utf8, payload)

    bytes_paquete = ruta_paquete.stat().st_size
    kb_origen = bytes_origen / 1024
    kb_paquete = bytes_paquete / 1024
    if bytes_origen > 0:
        pct = (1 - bytes_paquete / bytes_origen) * 100
    else:
        pct = 0.0

    return nombre_archivo, kb_origen, kb_paquete, pct


def centrar_ventana(ventana: tk.Tk, ancho: int, alto: int) -> None:
    ventana.update_idletasks()
    sw = ventana.winfo_screenwidth()
    sh = ventana.winfo_screenheight()
    x = max(0, (sw - ancho) // 2)
    y = max(0, (sh - alto) // 2)
    ventana.geometry(f"{ancho}x{alto}+{x}+{y}")


def main() -> None:
    root = tk.Tk()
    root.title("AGZ - Compresor Core")
    root.resizable(False, False)

    ancho, alto = 520, 260
    centrar_ventana(root, ancho, alto)

    marco = tk.Frame(root, padx=32, pady=32)
    marco.pack(fill=tk.BOTH, expand=True)

    def seleccionar_y_comprimir() -> None:
        ruta = filedialog.askopenfilename(
            title="Seleccionar archivo a comprimir",
            filetypes=[("Todos los archivos", "*.*")],
        )
        if not ruta:
            return
        try:
            nombre, kb_o, kb_p, pct = empaquetar_archivo(Path(ruta))
        except (OSError, ValueError, PermissionError) as exc:
            messagebox.showerror("AGZ - Compresor Core", str(exc))
            return

        texto = (
            f"Nombre del archivo original: {nombre}\n\n"
            f"Tamaño original: {kb_o:,.2f} KB\n\n"
            f"Tamaño del paquete AGZ: {kb_p:,.2f} KB\n\n"
            f"Espacio ahorrado: {pct:.4f}%"
        )
        messagebox.showinfo("AGZ - Compresor Core", texto)

    boton = tk.Button(
        marco,
        text="Seleccionar archivo a comprimir",
        command=seleccionar_y_comprimir,
        font=("Segoe UI", 14, "bold"),
        padx=28,
        pady=22,
        cursor="hand2",
    )
    boton.pack(expand=True)

    root.mainloop()


if __name__ == "__main__":
    main()
