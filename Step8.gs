// Globales
var docTemporal, body;

function guardarReabrir()
{  
  // Primer guardado
  docTemporal.saveAndClose();
  docTemporal = DocumentApp.openById(docTemporal.getId());
  body = docTemporal.getBody();
}

function generarInformeDePrediccion(matricesConfusion, modeloElegido, predicciones, nombreTablaDatos) {
  // Crear un nuevo documento de Google Docs
  var nombreDocumento = 'Informe Deserción Escolar - ' + Utilities.formatDate(new Date(), "GMT-5", "dd-MM-yyyy HH_mm_ss");
  docTemporal  = DocumentApp.create(nombreDocumento);

  body = docTemporal.getBody();
  
  // 1a Linea: Fecha
  body.appendParagraph(Utilities.formatDate(new Date(), "GMT-5", "EEEE, d 'de' MMMM 'de' yyyy")).setHeading(DocumentApp.ParagraphHeading.NORMAL);
  
  // 2a Linea: Título
  body.appendParagraph("Informe de aplicativo para apoyo a la detección temprana de la deserción escolar").setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  // 3a Linea: Nota
  body.appendParagraph("Nota. Por favor ser muy cuidadoso con la información contenida por el presente informe, ya que de no haber suficiente información en el archivo cargado inicialmente, el algoritmo podría estar generalizando erroneamente.\n\n").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  
  // 4a Linea: Algoritmos empleados
  body.appendParagraph("Los algoritmos de aprendizaje automático fueron los siguientes:").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  body.appendListItem("Modelo de Regresión Logística");
  body.appendListItem("Modelo Árbol de decisión");
  body.appendListItem("Modelo DNN Clasificador");
  body.appendParagraph("\n");

  // 5a Linea: Métricas de rendimiento
  body.appendParagraph("Las métricas de rendimiento funcional fueron las siguientes:").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  var modelos = [
    "1. Modelo de Regresión Logistica",
    "2. Modelo Árbol de decisión",
    "3. Modelo DNN Clasificador"
  ];
  // Calcular métricas para cada matriz de confusión y añadir al informe
  var contenidoInforme = "";
  matricesConfusion.forEach(function(matriz, indice) {
    var metricas = calcularMetricasDesdeMatriz(matriz);
    contenidoInforme += `\nMétricas de rendimiento para el ${modelos[indice]}:\n`;
    contenidoInforme += `Precisión: ${metricas.precision.toFixed(2)}%\n`;
    contenidoInforme += `Recall: ${metricas.recall.toFixed(2)}%\n`;
    contenidoInforme += `F1-Score: ${metricas.f1Score.toFixed(2)}%\n`;
  });

  body.appendParagraph(contenidoInforme);
  
  // 6a Linea: Mejor modelo
  body.appendParagraph("El mejor modelo y el empleado para predecir fue: " + modeloElegido).setHeading(DocumentApp.ParagraphHeading.NORMAL);
  
  // 7a Linea: Predicciones
  body.appendParagraph("\nEl modelo ha predicho los siguientes valores:").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  // Calcular el número de filas necesario, considerando 3 columnas. Redondear hacia arriba para incluir todos los datos.
  var numRows = Math.ceil(predicciones.length / 3);
  // Agregar una fila adicional para los encabezados
  var table = body.appendTable();
  
  // Agregar encabezados a la primera fila de la tabla
  var headerRow = table.appendTableRow();
  headerRow.appendTableCell("Consecutivo").setBackgroundColor("#f1f1f1");
  headerRow.appendTableCell("Estado").setBackgroundColor("#f1f1f1");
  headerRow.appendTableCell("Consecutivo").setBackgroundColor("#f1f1f1");
  headerRow.appendTableCell("Estado").setBackgroundColor("#f1f1f1");
  headerRow.appendTableCell("Consecutivo").setBackgroundColor("#f1f1f1");
  headerRow.appendTableCell("Estado").setBackgroundColor("#f1f1f1");
  
  // Llenar la tabla con los datos de predicciones con formato condicional
  for (var i = 0; i < numRows; i++) {
    var row = table.appendTableRow();
    
    for (var j = 0; j < 3; j++) { // Tres columnas de datos
      var prediccionIndex = i + j * numRows;
      if (predicciones[prediccionIndex]) { // Asegurar que el índice esté dentro del rango
        var prediccion = predicciones[prediccionIndex];
        var consecutivoCell = row.appendTableCell(prediccion.f[0].v); // Consecutivo
        var estadoCell = row.appendTableCell(prediccion.f[1].v); // Estado

        // Aplicar formato condicional
        if (prediccion.f[1].v === 'INACTIVO') {
          consecutivoCell.setBackgroundColor("#ff0000").setForegroundColor("#ffffff").setBold(true); // Fondo rojo, letra blanca y negrilla
          estadoCell.setBackgroundColor("#ff0000").setForegroundColor("#ffffff").setBold(true);
        } else if (prediccion.f[1].v === 'ACTIVO') {
          consecutivoCell.setBackgroundColor("#008000").setForegroundColor("#ffffff").setBold(true); // Fondo verde, letra blanca y negrilla
          estadoCell.setBackgroundColor("#008000").setForegroundColor("#ffffff").setBold(true);
        }
      } else {
        // Si no hay más datos para llenar, añadir celdas vacías
        row.appendTableCell("");
        row.appendTableCell("");
      }
    }
  }
  
  guardarReabrir();
  // 8a Linea: Análisis de los datos procesados
  body.appendParagraph("Los datos procesados tenían el siguiente comportamiento:").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  // Calcula estadísticas de las columnas
  const estadisticasColumnas = calcularEstadisticasDeColumnas(nombreTablaDatos);
 
  // Crear una tabla para mostrar las estadísticas
  var tablaEstadisticas = body.appendTable();
  // Agrega la fila de encabezados a la tabla
  var encabezados = tablaEstadisticas.appendTableRow();
  encabezados.appendTableCell("Columna").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Media").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Desviación Estándar").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Mínimo").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Cuartil Inferior").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Mediana").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Cuartil Superior").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Máximo").setBackgroundColor("#f1f1f1").editAsText().setBold(true);
  encabezados.appendTableCell("Porcentaje de valores no nulos").setBackgroundColor("#f1f1f1").editAsText().setBold(true);

  // Rellenar la tabla con las estadísticas de cada columna
  Object.keys(estadisticasColumnas).forEach(function(columna) {
    var estadisticas = estadisticasColumnas[columna];
    var filaEstadisticas = tablaEstadisticas.appendTableRow();
    filaEstadisticas.appendTableCell(columna);
    filaEstadisticas.appendTableCell(estadisticas.media);
    filaEstadisticas.appendTableCell(estadisticas.desviacionEstandar);
    filaEstadisticas.appendTableCell(estadisticas.minimo);
    filaEstadisticas.appendTableCell(estadisticas.cuartilInferior);
    filaEstadisticas.appendTableCell(estadisticas.mediana);
    filaEstadisticas.appendTableCell(estadisticas.cuartilSuperior);
    filaEstadisticas.appendTableCell(estadisticas.maximo);
    filaEstadisticas.appendTableCell(estadisticas.porcentajeNoNulo);
  });

  
  //console.log(body.getText())
  // Prepara para mover el documento al folder especificado
  var folder = DriveApp.getFolderById(folderId);
  Utilities.sleep(30000);
  docTemporal.saveAndClose();
  var file = DriveApp.getFileById(docTemporal.getId());

  // Crea una copia del documento en el directorio deseado
  var copiedFile = file.makeCopy(nombreDocumento, folder);
  
  // Opcional: elimina el archivo original de Mi Unidad
  file.setTrashed(true);

  // Retorna el ID del documento copiado en el folder de destino
  Logger.log('Documento creado en la carpeta especificada: ' + folder.getUrl());
  return generarPDFyObtenerURL(copiedFile.getId(), folderId);
}

function calcularMetricasDesdeMatriz(matrizConfusion) {
  var verdaderosPositivos = parseFloat(matrizConfusion[2][2] == ''?0:matrizConfusion[2][2]);
  var falsosPositivos = parseFloat(matrizConfusion[2][1] == ''?0:matrizConfusion[2][1]);
  var falsosNegativos = parseFloat(matrizConfusion[1][2] == ''?0:matrizConfusion[1][2]);
  var precision = (verdaderosPositivos / (verdaderosPositivos + falsosPositivos)) * 100;
  var recall = (verdaderosPositivos / (verdaderosPositivos + falsosNegativos)) * 100;
  var f1Score = 2 * (precision * recall) / (precision + recall);

  return {
    precision: isNaN(precision) ? 0 : precision,
    recall: isNaN(recall) ? 0 : recall,
    f1Score: isNaN(f1Score) ? 0 : f1Score
  };
}

function obtenerDatosDeBigQuery(nombreTabla) {
  var sqlQuery = 'SELECT * FROM `' + projectId + '.' + datasetId + '.' + nombreTabla + '`';
  
  var request = {
    query: sqlQuery,
    useLegacySql: false
  };

  console.log(sqlQuery)
  
  try {
    var queryResults = BigQuery.Jobs.query(request, projectId);
    if (queryResults.jobComplete) {
      var rows = queryResults.rows.map(function(row) {
        return row.f.map(function(field) {
          return field.v;
        }).join(", "); // Convierte cada fila en un string, separando los valores con comas
      });
      return rows; // Retorna un arreglo de strings, donde cada string representa una fila de la tabla
    } else {
      Logger.log('El Job de BigQuery no se completó.');
      return null;
    }
  } catch (error) {
    Logger.log('Error al ejecutar la consulta en BigQuery: ' + error.message);
    return null;
  }
}

function calcularEstadisticasDeColumnas(nombreTabla) {
  var estadisticas = {}; // Objeto para almacenar las estadísticas de todas las columnas

  // Obtiene la lista de columnas y sus tipos
  var columnasInfo = obtenerColumnasParaCategorizar(nombreTabla);
  // Solo incluye columnas numéricas para el cálculo de estadísticas
  var columnasNumericas = columnasInfo.columnasANoCategorizar;

  // Procesa solo las columnas numéricas
  columnasNumericas.forEach(function(columna) {
    var sqlQuery = `
    SELECT
      AVG(${columna}) AS media,
      STDDEV(${columna}) AS desviacionEstandar,
      MIN(${columna}) AS minimo,
      APPROX_QUANTILES(${columna}, 4)[OFFSET(1)] AS cuartilInferior,
      APPROX_QUANTILES(${columna}, 2)[OFFSET(1)] AS mediana,
      APPROX_QUANTILES(${columna}, 4)[OFFSET(3)] AS cuartilSuperior,
      MAX(${columna}) AS maximo,
      (COUNTIF(${columna} IS NULL) / COUNT(*)) * 100 AS porcentajeNoNulo
    FROM \`${projectId}.${datasetId}.${nombreTabla}\`
    `;
    
    console.log(sqlQuery);
  
    try {
      var queryResults = BigQuery.Jobs.query({query: sqlQuery, useLegacySql: false}, projectId);
      if (queryResults.jobComplete && queryResults.rows.length > 0) {
        var row = queryResults.rows[0];
        estadisticas[columna] = {
          media: parseFloat(row.f[0].v).toFixed(2),
          desviacionEstandar: parseFloat(row.f[1].v).toFixed(2),
          minimo: parseFloat(row.f[2].v).toFixed(2),
          cuartilInferior: parseFloat(row.f[3].v).toFixed(2),
          mediana: parseFloat(row.f[4].v).toFixed(2),
          cuartilSuperior: parseFloat(row.f[5].v).toFixed(2),
          maximo: parseFloat(row.f[6].v).toFixed(2),
          porcentajeNoNulo: parseFloat(row.f[7].v).toFixed(2) + '%'
        };
      } else {
        Logger.log('No se completó el trabajo de BigQuery o no se encontraron filas.');
      }
    } catch (error) {
      Logger.log('Error al ejecutar la consulta en BigQuery: ' + error.message);
    }
  });

  return estadisticas;
}


function generarPDFyObtenerURL(docId, destinationFolderId) {
  try {
    // Obtiene el documento de Google Docs
    var doc = DriveApp.getFileById(docId);
    var docName = doc.getName();

    // Crea el PDF
    var blob = doc.getAs("application/pdf");
    var pdfName = docName.replace(/\.gdoc$/, '') + ".pdf"; // Asegura que el nombre del archivo sea adecuado para un PDF
    var pdfFile = DriveApp.createFile(blob.setName(pdfName));

    // Mueve el PDF al folder de destino
    var destinationFolder = DriveApp.getFolderById(destinationFolderId);
    var movedFile = pdfFile.makeCopy(pdfName, destinationFolder);
    
    // Opcional: Elimina el PDF temporal en Mi unidad
    pdfFile.setTrashed(true);

    // Retorna la URL del PDF
    return movedFile.getUrl();
  } catch (error) {
    Logger.log('Error al generar el PDF: ' + error.message);
    return null; // Retorna null en caso de error
  }
}