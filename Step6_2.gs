function elegirMejorModeloBasadoEnConfusion(matricesConfusion) {
  if (!matricesConfusion || !matricesConfusion.length) {
    throw new Error("No se proporcionaron matrices de confusión");
  }

  var resultados = matricesConfusion.map(function(matriz, indice) {
    //console.log("Matriz de confusión para el modelo " + indice + ": ", matriz);
    var verdaderosPositivos = parseFloat(matriz[2][2] == ''?0:matriz[2][2]);
    var falsosPositivos = parseFloat(matriz[2][1] == ''?0:matriz[2][1]);
    var falsosNegativos = parseFloat(matriz[1][2] == ''?0:matriz[1][2]);
    //console.log("VP: " + verdaderosPositivos + ", FP: " + falsosPositivos + ", FN: " + falsosNegativos);

    var precision = calcularPrecision(verdaderosPositivos, falsosPositivos)*100;
    var recall = calcularRecall(verdaderosPositivos, falsosNegativos)*100;
    var f1Score = calcularF1Score(precision, recall);

    console.log("Modelo " + indice + " - Precisión: " + precision + ", Recall: " + recall + ", F1: " + f1Score);

    return {
      modeloIndice: indice,
      precision: precision,
      recall: recall,
      f1Score: f1Score
    };
  });

  var mejorModelo = resultados.reduce(function(modeloActual, modeloSiguiente) {
    return modeloActual.f1Score > modeloSiguiente.f1Score ? modeloActual : modeloSiguiente;
  });

  return mejorModelo;
}

function calcularPrecision(verdaderosPositivos, falsosPositivos) {
  if (falsosPositivos === 0 && verdaderosPositivos === 0) return 0;
  return (verdaderosPositivos / (verdaderosPositivos + falsosPositivos));
}

function calcularRecall(verdaderosPositivos, falsosNegativos) {
  if (falsosNegativos === 0 && verdaderosPositivos === 0) return 0;
  return (verdaderosPositivos / (verdaderosPositivos + falsosNegativos));
}

function calcularF1Score(precision, recall) {
  if (precision === 0 || recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}


function obtenerMatrizConfusion(modelos, nombreTabla) {
  var matricesConfusion = [];

  modelos.forEach(function(modelo) {
    var sqlQuery = 'SELECT * FROM ML.CONFUSION_MATRIX(MODEL `' + datasetId + '.' + modelo + '`, (SELECT * FROM `' + datasetId + '.' + nombreTabla + '`))';
    //console.log(sqlQuery)
    var request = {
      query: sqlQuery,
      useLegacySql: false
    };

    try {
      var queryResults = BigQuery.Jobs.query(request, projectId);
      if (queryResults.jobComplete) {
        var rows = queryResults.rows;
        var matriz = rows.map(function(row) {
          return row.f.map(function(item) {
            return item.v; // asumiendo que .v contiene el valor que quieres extraer
          });
        });
        matricesConfusion.push(matriz);
      } else {
        Logger.log('El Job de BigQuery para el modelo ' + modelo + ' no se completó.');
      }
    } catch (error) {
      Logger.log('Error al ejecutar la consulta en BigQuery para el modelo ' + modelo + ': ' + error.message);
    }
  });

  return matricesConfusion;
}
