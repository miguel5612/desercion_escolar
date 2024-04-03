# Sistema de tratamiento de datos y formación de modelos

## Resumen

Este documento detalla la implementación y el uso de un sistema diseñado para cargar, procesar y analizar datos, con el objetivo final de entrenar modelos de aprendizaje automático para tareas específicas. El sistema utiliza Google Apps Script, Google Drive, Google Sheets y Google BigQuery, demostrando un enfoque versátil para el manejo y análisis de datos.

## Caracteristicas

* Formulario HTML para subir archivos.
* Funciones de Google Apps Script para la gestión y conversión de archivos.
* Integración con Google BigQuery para el procesamiento de datos y la formación de modelos.

## Inicio Rapido

### Prerequisitos

* Acceso a Google Drive.
* Acceso a Google BigQuery.
* Conocimientos básicos de HTML y JavaScript.

### Instalación

* Configure un folder en su google drive para almacenar archivos 
* Configure el folder ID en el archivo secret.gs
* Configure el proyecto y asigne los permisos correspondientes en Google Cloud Platform (GCP)

### Uso

* Envío de formularios: Utilice el formulario HTML para cargar un archivo Excel.
* Ejecución de secuencias de comandos: Ejecuta las funciones de Google Apps Script proporcionadas para convertir, procesar los datos y entrenar los modelos.
* Análisis y predicción: Utiliza los modelos entrenados para tus tareas específicas de análisis y predicción de datos.

## Mantenimiento
Ejecute regularmente la función ejecutarMantenimientoDiario() para limpiar conjuntos de datos, modelos y archivos temporales, asegurando que su entorno está optimizado y es seguro.

## Contribución
Las contribuciones para mejorar el sistema o ampliar sus capacidades son bienvenidas. Por favor, asegúrese de seguir los estándares de codificación y proporcione documentación de sus cambios.

## Licencia
GNU V3

## Conocimientos
Agradezca a todos los colaboradores, fuentes de inspiración o recursos que han sido de gran ayuda durante el desarrollo.
Este LÉAME proporciona un esquema básico. Adáptelo y amplíelo en función de los requisitos y características específicos de su sistema.