// Paso 5. Los datos se van a BigQuery

function googleSheetsToBigQuery(gsID) {
  console.log(gsID)
  var fileId = gsID; // ID de Google Sheets
  // Genera un ID único para la tabla usando la fecha y hora actual
  var tableId = 'import_' + new Date().toISOString().replace(/[-:.T]/g, '').slice(0,14);
  
  var sheet = SpreadsheetApp.openById(fileId).getSheets()[0]; // Asume que los datos están en la primera hoja
  var range = sheet.getDataRange(); // Obtiene todos los datos de la hoja
  var values = range.getValues(); // Obtiene los valores en un array 2D

  // Preparar la inserción de datos en BigQuery
  var data = [];
  var jsonData = '';
  for (var i = 1; i < values.length; i++) { // Comienza en 1 para saltar el encabezado
    var row = values[i];
    var rowData = {
      "Consecutivo": row[0],
      "EstadoMatricula": row[1],
      "TipoDoc": row[2],
      "Semestre": row[3],
      "Pensum": row[4],
      "AnoIngreso": row[5],
      "SemestreIngreso": row[6],
      "Promedio": row[7],
      "ColegioEgresado": row[8],
      "MunicipioNacimiento": row[9],
      "DistanciaMunicipioACucuta": row[10]
    };
     // Añadir cada objeto JSON como una nueva línea en el string jsonData
    if (i > 1) jsonData += '\n';
    jsonData += JSON.stringify(rowData);
  }


  // Configura el job para cargar los datos a BigQuery
  var bigQueryJob = {
    configuration: {
      load: {
        destinationTable: {
          projectId: projectId,
          datasetId: datasetId,
          tableId: tableId
        },
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: true, // Utiliza la autodetección de esquema
      }
    }
  };

  // Carga los datos a BigQuery
  try {
    var job = BigQuery.Jobs.insert(bigQueryJob, projectId, Utilities.newBlob(jsonData, 'application/octet-stream'));
    Logger.log('Load job started for Job ID: ' + job.jobReference.jobId + ' with Table ID: ' + tableId);
    // Esperar a que el trabajo se complete
    var status = job.status;
    while (status.state != 'DONE') {
      Utilities.sleep(1000); // Esperar 1 segundo antes de volver a verificar
      job = BigQuery.Jobs.get(projectId, job.jobReference.jobId);
      status = job.status;
    }

    // Verificar si el trabajo se completó sin errores
    if (status.errorResult) {
      Logger.log('El trabajo de carga falló con error: ' + status.errorResult.message);
    } else {
      Logger.log('El trabajo de carga se completó exitosamente.');
      // Aquí puedes proceder con la verificación de los datos
    }

  } catch (error) {
    Logger.log('Error al insertar job en BigQuery: ' + error.message);
  }

  // Después de cargar los datos a BigQuery en tu función googleSheetsToBigQuery
  var primerRegistroEsperado = data[0]; // Asume que 'data' es tu array de registros
  verificarCargaBigQuery(projectId, datasetId, tableId, primerRegistroEsperado);

  return tableId;
}

function verificarCargaBigQuery(projectId, datasetId, tableId, primerRegistroEsperado) {
  var query = 'SELECT * FROM `' + projectId + '.' + datasetId + '.' + tableId + '` LIMIT 1';
  var request = {
    query: query,
    useLegacySql: false
  };

  try {
    var queryResult = BigQuery.Jobs.query(request, projectId);
    if (queryResult && queryResult.rows && queryResult.rows.length > 0) {
      var primerRegistro = queryResult.rows[0];
      // Aquí deberías adaptar la lógica de comparación según la estructura de tus datos.
      // Por ejemplo, si quieres comparar el campo "Consecutivo":
      if (primerRegistro.f[0].v == primerRegistroEsperado.Consecutivo) {
        Logger.log('La verificación de la carga de datos fue exitosa.');
      } else {
        Logger.log('La verificación de la carga de datos falló.');
      }
    } else {
      Logger.log('No se encontraron datos en la tabla.');
    }
  } catch (error) {
    Logger.log('Error al verificar los datos en BigQuery: ' + error.message);
  }
}