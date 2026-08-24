# UtiliTools v2

Reconstrucción editorial y técnica de [utilitools.com.ar](https://www.utilitools.com.ar/) orientada a utilidad real, AdSense y crecimiento orgánico sostenible. El posicionamiento vigente es **“el copiloto del bolsillo argentino”**: decidir mejor antes de comprar, pagar, cobrar o vender.

## Principios

- Diez herramientas mantenibles en lugar de decenas de páginas superficiales.
- Tres territorios conectados: Ahorrar, Emprender y Trabajar.
- Compra inteligente como puerta de entrada masiva: compara 2x1, 3x2, segunda unidad, descuentos y tamaños distintos.
- Fórmula, ejemplo, límites, fuentes y fecha de revisión en cada herramienta.
- Cálculos en el navegador; los valores no se envían al servidor.
- Analytics bajo consentimiento y AdSense desactivado hasta obtener aprobación.
- URLs canónicas limpias y redirecciones permanentes para páginas heredadas relevantes.
- Pruebas automatizadas de fórmulas y QA de contenido, enlaces, sitemap y datos estructurados.

## Desarrollo

```bash
npm test
npm run build
npm run check
```

El resultado estático se genera en `dist/` sin dependencias externas.

## Contacto público

Definí `PUBLIC_CONTACT_EMAIL` durante el build para mostrar la dirección pública autorizada en `/contacto`. El correo no queda grabado en el repositorio.

## Publicidad

`ads.txt` conserva el publisher ID existente. El script y los espacios publicitarios no se incorporan hasta que AdSense apruebe el sitio y exista una configuración de consentimiento adecuada para cada región.
