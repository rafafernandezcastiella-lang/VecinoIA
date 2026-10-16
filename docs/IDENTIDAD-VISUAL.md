# Identidad visual y fondos de comunidad

Actualización: 13 de octubre de 2026.

## Referencia

Manual de identidad visual ANPARA facilitado por el usuario, página 5 para colores, páginas 6 y 8 para composición y aplicaciones digitales.

| Color | Valor | Aplicación |
|---|---|---|
| Azul metálico premium | #0072CE | Acciones y navegación seleccionada |
| Azul profundo | #002D5A | Navegación, titulares y paneles sobre fotografía |
| Plata metálica | #C0C0C0 | Líneas y detalles, no texto pequeño sobre blanco |
| Blanco puro | #FFFFFF | Paneles, formularios y texto sobre azul |
| Gris grafito | #333333 | Texto principal |
| Azul claro | #66A3E0 | Detalles y foco visible |

Las superficies suaves y veladuras son tintas de la paleta. Se mantienen el nombre y el símbolo de VecinoIA; no se ha recreado el logotipo ANPARA. La familia tipográfica no está fijada como definitiva en el manual; se usa una pila local Aptos / Inter / Segoe UI, sin descargas externas.

## Fotografía por comunidad

`backgroundImage` y `backgroundPosition` en `src/communities.mjs` definen la imagen y su encuadre. Cada comunidad puede tener su propia foto. Las imágenes actuales son ficticias y fueron generadas mediante la herramienta integrada imagegen, sin usar API o CLI alternativos.

- `public/images/los-olivos.png`: urbanización contemporánea con jardín y olivos.
- `public/images/plaza-mayor.png`: comunidad urbana con patio y balcones, sin piscina.

La foto ocupa el fondo de la web, con una veladura azul. Los paneles tienen superficies claras y las cabeceras se apoyan en azul profundo. El pie identifica la comunidad ficticia y la imagen generada con IA.

## Prompts de generación completos

### Los Olivos

```text
Use case: photorealistic-natural. Asset type: wide website background photograph. Create a fictional Spanish residential community called Residencial Los Olivos, contemporary attractive four-storey apartment buildings in off-white stone with spacious balconies, a landscaped communal garden with olive trees and lawn, subtle paved paths, credible Spanish architecture. Wide 16:9 architectural photography, warm natural late afternoon light, restrained premium quality, realistic materials, no people, no cars, no text, no signage, no logos, no watermarks. Building and garden clearly visible, balanced wide composition useful behind readable web interface panels. This is a fictional community for a hackathon demo.
```

### Plaza Mayor

```text
Use case: photorealistic-natural. Asset type: wide website background photograph. Create a fictional Spanish urban apartment community called Comunidad Plaza Mayor, elegant five-storey apartment building with warm pale stone and subtle terracotta details, balconies around a peaceful paved communal courtyard, a few small trees and planters, no swimming pool. Wide 16:9 architectural photography, natural warm late afternoon sunlight, realistic professional property photography, no people, no cars, no text, no signage, no logos, no watermarks. Balanced wide composition useful as a website background behind interface panels. This is a fictional community for a hackathon demo.
```
