
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('paginaWeb.html');
}

/*

Funciones para calcular dinamicamente la probabilidad de deserción de un estudiante
usando Google App Script.

Creado por IE Miguel Angel Califa Urquiza
Fecha: 2024 - 03

Explicación:
1. Una docente o directivo descarga el template excel y lo diligencia con sus metricas.
2. Se procede con la carga del excel en paginaWeb.html
3. El excel se carga en una ubicación temporal.
4. El excel se convierte en google sheets
5. Los datos se van a BigQuery
6. Se entrenan los 3 modelos y se retornan las matrices de confusión
7. Se selecciona el mejor modelo y se predice con el mejor modelo
8. Genero el reporte y envío via email (gmail)

*/