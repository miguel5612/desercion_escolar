function convertirArchivo(id)
{ 
    var file = DriveApp.getFileById(id);
    if(file.getMimeType().includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) 
    {
      file = convertExcelToGoogleSheets(id);
      var fileO = DriveApp.getFileById(id);
      fileO.setTrashed(true);
      console.log("Convirtiendo");
      file.alternateLink = file.alternateLink;
      file.id = file.id;
    }
    else
    {
      file.alternateLink = file.getUrl();
    }
    var responseObj = {filename: file.title, fileId: file.id, fileUrl: file.alternateLink};
    return responseObj;
}

function convertExcelToGoogleSheets(fileId) {
  let excelFile = DriveApp.getFileById(fileId);
   let blob = excelFile.getBlob();
  let config = {
    title: excelFile.getName().replace(".xlsx", ""),
    parents: [{id: excelFile.getParents().next().getId()}],
    mimeType: MimeType.GOOGLE_SHEETS
  };
  let spreadsheet = Drive.Files.insert(config, blob);
  return spreadsheet;
}