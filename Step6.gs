function construirYEntrenarModelos(nombreTabla) {
  var columnas = obtenerColumnasParaCategorizar(nombreTabla);
  // Supongamos que columnasACategorizar ya contiene los nombres de las columnas correctos
  var columnasACategorizarSQL = columnas.columnasACategorizar.map(function(name) {
    return `CAST(${name} AS STRING) AS ${name}`;
  }).join(", ");
  
  var columnasNoCategorizar = columnas.columnasANoCategorizar.join(", ");
  var todasLasColumnas = columnasNoCategorizar;
  if (columnasACategorizarSQL) {
    todasLasColumnas += ", " + columnasACategorizarSQL;
  }

  // Modelos a entrenar
  var modelos = [
    { nombre: "modelo_regresion_logistica", tipo: "LOGISTIC_REG" },
    { nombre: "modelo_arbol_decision", tipo: "BOOSTED_TREE_CLASSIFIER" },
    { nombre: "modelo_dnn_clasificador", tipo: "DNN_CLASSIFIER", opciones: "hidden_units=[64,32], max_iterations=50" }
  ];

  modelos.forEach(function(modelo) {
    var modeloNombreCompleto = `${modelo.nombre}_${new Date().getTime()}`;
    var sqlQuery = construirSqlModelo(nombreTabla, modeloNombreCompleto, modelo.tipo, modelo.opciones, columnas);
    
    // Ejecuta cada query y espera a que se complete antes de continuar
    //var exito = ejecutarQueryBigQueryEsperaCompleta(sqlQuery);
    var jobId = soloEnviarBigQuery(sqlQuery);
    if (jobId.length == 0) {
      Logger.log(`Error al entrenar modelo: ${modeloNombreCompleto}`);
      return; // Sale si hay un error
    } else {
      modelo.nombre = modeloNombreCompleto + "@" + jobId;
      Logger.log(`Modelo entrenado exitosamente: ${modelo.nombre}`);
    }
  });

  return modelos;
}

function soloEnviarBigQuery(querySql)
{
  var jobData = {
    configuration: {
      query: {
        query: querySql,
        useLegacySql: false
      }
    }
  };
  var insertResponse = BigQuery.Jobs.insert(jobData, projectId);
  return insertResponse.jobReference.jobId;
}

function estaListoJobBigQuery(jobId) {
  // Obtiene el estado del trabajo
  var jobStatus = BigQuery.Jobs.get(projectId, jobId);

  // Si el estado no está disponible, retorna un error
  if (!jobStatus.hasOwnProperty("status")) {
    Logger.log(`Error al obtener estado del job: ${jobId}`);
    return false;
  }

  // Revisa el estado del trabajo
  switch (jobStatus.status.state) {
    case "DONE":
      // Si el trabajo se completó exitosamente, retorna true
      if (jobStatus.status.errorResult == null) {
        Logger.log(`Job completado exitosamente: ${jobId}`);
        return true;
      } else {
        // Si el trabajo falló, registra el error y retorna false
        Logger.log(`Error en el job: ${jobId}`);
        Logger.log(jobStatus.status.errorResult);
        return false;
      }
    case "RUNNING":
      // Si el trabajo aún está en ejecución, retorna "en ejecución"
      Logger.log(`Job en ejecución: ${jobId}`);
      //return "en ejecución";
      return false;
    case "PENDING":
      // Si el trabajo está pendiente, retorna "pendiente"
      Logger.log(`Job pendiente: ${jobId}`);
      //return "pendiente";
      return false;
    default:
      // Si el estado no es reconocido, retorna un error
      Logger.log(`Estado desconocido del job: ${jobStatus.status.state}`);
      return false;
  }
}

function ejecutarQueryBigQueryEsperaCompleta(querySql) {
  var jobData = {
    configuration: {
      query: {
        query: querySql,
        useLegacySql: false
      }
    }
  };

  try {
    // Inicia el trabajo de manera asíncrona
    var insertResponse = BigQuery.Jobs.insert(jobData, projectId);
    var jobId = insertResponse.jobReference.jobId;
    Logger.log('Query job started for Job ID: ' + jobId);

    // Verificar el estado del trabajo con un retardo inicial
    Utilities.sleep(10000); // Espera inicial antes de empezar a chequear el estado
    
    var estado;
    var intentosMaximos = 30;
    var intento = 0;
    
    do {
      // Verifica el estado del trabajo
      var job = BigQuery.Jobs.get(projectId, jobId);
      estado = job.status.state;
      
      if (estado === 'DONE') {
        if (job.status.errorResult) {
          Logger.log('El trabajo de carga falló con error: ' + job.status.errorResult.message);
          return false;
        } else {
          Logger.log('El trabajo de carga se completó exitosamente.');
          return true;
        }
      }

      // Espera un poco antes de la próxima verificación
      Utilities.sleep(10000); // 10 segundos entre cada verificación
      intento++;
    } while (intento < intentosMaximos && estado !== 'DONE');

    if (estado !== 'DONE') {
      Logger.log('El trabajo no completó después de ' + intentosMaximos + ' intentos.');
      return false;
    }
  } catch (error) {
    Logger.log('Error al iniciar job en BigQuery: ' + error.message);
    return false;
  }
}

function construirSqlModelo(nombreTabla, modeloNombreCompleto, tipoModelo, opcionesModelo, columnas) {
  var nombreColumnaPrediccion = obtenerNombreColumnaPrediccion(nombreTabla);
  // Construcción de la parte de CAST para columnas a categorizar
  var columnasACategorizarSQL = columnas.columnasACategorizar.map(function(name) {
    return `CAST(${name} AS STRING) AS ${name}`;
  }).join(", ");

  // Preparación de la lista completa de columnas para la consulta excluyendo la columna de predicción
  var todasLasColumnasArray = columnas.columnasANoCategorizar.filter(function(columna) {
    return columna !== nombreColumnaPrediccion; // Excluye la columna de predicción
  });
  console.log("AQUI YA DEBE IR SIN LA COLUMNA DE PREDICCION")
  console.log(todasLasColumnasArray)

  // Si existen columnas a categorizar, se añaden a la lista
  if (columnasACategorizarSQL) {
    todasLasColumnasArray.push(columnasACategorizarSQL);
  }

  // Convertir el arreglo actualizado a una cadena para la consulta SQL
  var todasLasColumnas = todasLasColumnasArray.join(", ");

  // Construcción de la cláusula OPTIONS para la consulta SQL, incluyendo opciones específicas del modelo
  var opcionesSql = `model_type='${tipoModelo}'`;
  if (opcionesModelo) {
    opcionesSql += `, ${opcionesModelo}`;
  }

  // Construcción final de la consulta SQL para crear y entrenar el modelo
  var sqlQuery = `
  CREATE OR REPLACE MODEL \`${projectId}.${datasetId}.${modeloNombreCompleto}\`
  OPTIONS(${opcionesSql}, input_label_cols=['${nombreColumnaPrediccion}']) AS
  SELECT
    ${todasLasColumnas}
  FROM
    \`${projectId}.${datasetId}.${nombreTabla}\`
  WHERE
    ${nombreColumnaPrediccion} IN ('ACTIVO', 'INACTIVO');
  `;

  return sqlQuery;
}

function obtenerNombreColumnaPrediccion(tableId) {
  try {
    var table = BigQuery.Tables.get(projectId, datasetId, tableId);
    if (table && table.schema && table.schema.fields) {
      // Buscar en todas las columnas la que contenga el texto "estado"
      var columnaEstado = table.schema.fields.find(function(field) {
        return field.name.toLowerCase().includes("estado");
      });
      return columnaEstado ? columnaEstado.name : null;
    } else {
      Logger.log('La tabla no tiene esquema o campos definidos.');
      return null;
    }
  } catch (error) {
    Logger.log('Error al obtener los metadatos de la tabla: ' + error.message);
    return null;
  }
}


function obtenerColumnasParaCategorizar(nombreTabla) {
  var sqlQuery = `
  SELECT column_name, data_type 
  FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.COLUMNS\` 
  WHERE table_name='${nombreTabla}';
    `;

  var request = {
    query: sqlQuery,
    useLegacySql: false
  };

  var columnasParaCategorizar = [];
  var columnasNoCategorizar = [];

  try {
    var response = BigQuery.Jobs.query(request, projectId);
    if (response && response.rows) {
      response.rows.forEach(function(row) {
        var columnName = row.f[0].v;
        var dataType = row.f[1].v;

        if (columnName !== 'EstadoMatricula' && ['INT64', 'FLOAT64', 'NUMERIC', 'BIGNUMERIC'].indexOf(dataType) === -1) {
          columnasParaCategorizar.push(columnName);
        } else if (columnName !== 'EstadoMatricula') {
          columnasNoCategorizar.push(columnName);
        }
      });
    }

    Logger.log("Columnas a categorizar: " + columnasParaCategorizar);
    Logger.log("Columnas no a categorizar: " + columnasNoCategorizar);

    return {
      columnasACategorizar: columnasParaCategorizar,
      columnasANoCategorizar: columnasNoCategorizar
    };
  } catch (error) {
    Logger.log('Error al obtener columnas: ' + error.message);
    return {
      columnasACategorizar: [],
      columnasANoCategorizar: []
    };
  }
}
