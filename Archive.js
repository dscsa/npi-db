
function archiveBackups() {
  //when closing a batch, note the last batch timestampt
  var timestamp = Utilities.formatDate(new Date(), "GMT-04:00", "MM-dd-yyyy");
  
  var sh = SpreadsheetApp.openById(DB_FILE_ID)
  var sheets = sh.getSheets()
  var archive_sheet = SpreadsheetApp.openById(ARCHIVE_FILE_ID)

  for(var i = 0; i < sheets.length; i++){
     var sheet_name = sheets[i].getName()
      if((sheet_name.indexOf("BACKUP") > -1)){
        sheets[i].copyTo(archive_sheet)
        sh.deleteSheet(sheets[i]);
      }
  }
}