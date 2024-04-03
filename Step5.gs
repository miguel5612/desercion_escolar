// Paso 5. Los datos se van a BigQuery

function googleSheetsToBigQuery(gsID) {
  console.log(gsID);
  var fileId = gsID; // ID de Google Sheets
  var tableId = 'import_' + new Date().toISOString().replace(/[-:.T]/g, '').slice(0,14);

  var sheet = SpreadsheetApp.openById(fileId).getSheets()[0];
  var range = sheet.getDataRange();
  var values = range.getValues();
  var headers = values[0]; // La primera fila contiene los encabezados
  // Procesar nombres de columnas para asegurar compatibilidad con BigQuery
  headers = headers.map(function(header, index) {
    return header.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
                .replace(/[^a-zA-Z0-9_]/g, "_") // Reemplazar espacios y caracteres especiales por subrayados
                .replace(/_{2,}/g, "_") // Eliminar subrayados consecutivos
                .replace(/^_+|_+$/g, ""); // Eliminar subrayados al inicio y al final
  });
  // Preparar la inserción de datos en BigQuery adaptándose a las columnas dinámicas
  var jsonData = values.slice(1).map(function(row) {
    var rowData = {};
    row.forEach(function(cell, index) {
      rowData[headers[index]] = cell;
    });
    return JSON.stringify(rowData);
  }).join('\n');

  var bigQueryJob = {
    configuration: {
      load: {
        destinationTable: {
          projectId: projectId,
          datasetId: datasetId,
          tableId: tableId
        },
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: true, // Permite la autodetección del esquema basado en los datos de entrada
      }
    }
  };

  // Carga los datos a BigQuery
  try {
    var job = BigQuery.Jobs.insert(bigQueryJob, projectId, Utilities.newBlob(jsonData, 'application/octet-stream'));
    Logger.log('Load job started for Job ID: ' + job.jobReference.jobId + ' with Table ID: ' + tableId);
    var status = job.status;
    while (status.state != 'DONE') {
      Utilities.sleep(1000);
      job = BigQuery.Jobs.get(projectId, job.jobReference.jobId);
      status = job.status;
    }

    if (status.errorResult) {
      Logger.log('El trabajo de carga falló con error: ' + status.errorResult.message);
    } else {
      Logger.log('El trabajo de carga se completó exitosamente.');
    }
  } catch (error) {
    Logger.log('Error al insertar job en BigQuery: ' + error.message);
  }
  return tableId;
}
