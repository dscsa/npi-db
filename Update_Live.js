//Go through Staging Area
//Based off tag in the approved columns, make changes to the live

function updateLive(){

  var sh = SpreadsheetApp.openById(DB_FILE_ID)
  var staging = sh.getSheetByName('Staging Area')
  var live = sh.getSheetByName('Copy of Live') //TODO: Switch this to 'Live'
  
  
  
}