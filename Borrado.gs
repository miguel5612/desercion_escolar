function ejecutarMantenimientoDiario()
{
  borrarTablasDataset();
  borrarContenidoFolder();
  borrarTodosLosModelos();
}

function borrarTablasDataset() {
  const dataset = BigQuery.Datasets.get(projectId, datasetId);
  const tables = BigQuery.Tables.list(projectId, datasetId);
  
  if (tables.tables !== undefined) {
    tables.tables.forEach(function(table) {
      BigQuery.Tables.remove(projectId, datasetId, table.tableReference.tableId);
      Logger.log(`Tabla ${table.tableReference.tableId} borrada.`);
    });
  } else {
    Logger.log('No se encontraron tablas para borrar.');
  }
}

function borrarContenidoFolder() {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  
  while (files.hasNext()) {
    const file = files.next();
    file.setTrashed(true); // O usar file.remove si quieres eliminarlo permanentemente
    Logger.log(`Archivo ${file.getName()} movido a la papelera.`);
  }
  
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    const subFolder = subFolders.next();
    subFolder.setTrashed(true); // O usar subFolder.remove para eliminarlo permanentemente
    Logger.log(`Subfolder ${subFolder.getName()} movido a la papelera.`);
  }
}

function borrarTodosLosModelos() {
  const models = BigQuery.Models.list(projectId, datasetId);
  
  if (models.models !== undefined) {
    models.models.forEach(function(model) {
      const modelId = model.modelReference.modelId;
      try {
        BigQuery.Models.remove(projectId, datasetId, modelId);
        Logger.log(`Modelo ${modelId} borrado.`);
      } catch (error) {
        Logger.log(`Error al borrar el modelo ${modelId}: ${error}`);
      }
    });
  } else {
    Logger.log('No se encontraron modelos para borrar.');
  }
}
