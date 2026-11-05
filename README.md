# OptimaGuía · Basílica de San Juan de Dios · prototipo funcional

Audioguía web (dirección de diseño v4) para presentar al equipo: encuesta inicial, inicio, reproductor con transcripción sincronizada, fichas, asistente, plano por plantas, ajustes de accesibilidad y realidad aumentada simulada con el guía 3D.

- **Voz:** ElevenLabs v4 Turbo en tiempo real, frase a frase, con la palabra que suena resaltada. Sin conexión, la voz del dispositivo.
- **Guía con IA:** Claude responde solo con el contenido de la visita y cita la parada. Sin conexión, respuestas preparadas.
- **Claves:** no hay ninguna en este repositorio. Viven como secretos del Worker de Cloudflare `optimaguia-ra` (código en `prototipo-ra/worker`, rutas `/sjd/ask` y `/sjd/tts`). `?api=` (vacío) en la dirección prueba la app sin servidor.
- **RA simulada:** cámara trasera + giroscopio (3 grados de libertad); los puntos se colocan al azar alrededor del visitante.
- **Animación:** GSAP (SplitText, Draggable, ScrollTrigger, Flip, CustomEase). Respeta «Reducir movimiento».
- **Contenido:** `js/data.js` (textos provisionales). Tras cambiarlo, `node tools/build-contenido.mjs` y desplegar el Worker para que el guía con IA diga lo mismo.
