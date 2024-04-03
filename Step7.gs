function predecirEtiquetas(modelo, nombreTabla) {
   var nombreColumnaPrediccion = obtenerNombreColumnaPrediccion(nombreTabla);
   var nombreColumnaPrediccionFormateado = nombreColumnaPrediccion.replace(/\s+/g, '_');
  // var columnasRelevantes = obtenerColumnasParaCategorizar(nombreTabla);
  var sqlQuery = `
    SELECT
      Consecutivo,
      predicted_${nombreColumnaPrediccionFormateado} AS EstadoMatriculaPredicho
    FROM
      ML.PREDICT(MODEL \`${datasetId}.${modelo}\`, (
        SELECT
          *
        FROM
          \`${datasetId}.${nombreTabla}\`
        WHERE
          ${nombreColumnaPrediccion} = ''
      ))
    `;
  //console.log(sqlQuery); // Para depuración
  var request = {
    query: sqlQuery,
    useLegacySql: false
  };

  try {
    var queryResults = BigQuery.Jobs.query(request, projectId);
    if (queryResults.jobComplete) {
      console.log("Predicciones completadas:");
      var rows = queryResults.rows;
      rows.forEach(function(row) {
        // Revisar la presencia y estructura de cada celda esperada
        if (!row.f || row.f.length < 2) { // Asumiendo que esperas al menos 2 columnas
          console.log('Faltan celdas esperadas o estructura de fila incorrecta:', row);
        } else {
          var consecutivo = row.f[0].v;
          var estadoMatriculaPredicho = row.f[1].v; // Asumiendo que estas son las columnas esperadas
          console.log(`Consecutivo: ${consecutivo}, EstadoMatriculaPredicho: ${estadoMatriculaPredicho}`);
        }
      });
      return rows; 
    } else {
      Logger.log('El Job de BigQuery no se completó.');
      return null;
    }
  } catch (error) {
    Logger.log('Error al ejecutar la consulta en BigQuery: ' + error.message);
    return null;
  }
}
