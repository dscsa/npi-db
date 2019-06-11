function onOpen(e) {
  var ui = SpreadsheetApp.getUi()
  
  ui.createMenu('DB Options')
    .addItem('Update Live Sheet', 'updateLive')
    .addToUi();

}


