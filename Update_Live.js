//Go through Staging Area
//Based off tag in the approved columns, make changes to the live
function updateLive(){

  var sh = SpreadsheetApp.openById(DB_FILE_ID)
  
  var staging = sh.getSheetByName('Staging Area')
  var live = sh.getSheetByName('Copy of Live') //TODO: Switch this to 'Live'
  
  var staging_data = staging.getDataRange().getValues()
  
  var npi_to_add = [] //will be an array of rows that need to be added to live
  var changes_to_make = {} //will have key=npi, val = {changes to make where key=column, val=value}
  
  var staging_approved_index = 1
  var staging_npi_index = 2
  var db_fields = ['NAME','STREET','CITY','ZIP','PHONE','FAX']
  
  var header_row = staging_data[0]
  
  for(var i = staging_data.length - 1; i > 0; i--){
  
    var tag = staging_data[i][staging_approved_index].toString().trim()
    
    if(tag.length > 0){ //only do something for approved rows
      
      var row = staging_data[i]
      
      if(tag == 'ADD'){
        
        var new_row = removeEmptyElems(row.slice(2))
        npi_to_add.push(new_row)
        
      } else {
        var tags = []
        
        if(tag == 'ALL'){
          tags = db_fields  //then update all fields
        } else{
          tags = removeEmptyElems(tag.split(","))
        }
        
        var updates = {}
        var tags = removeEmptyElems(tag.split(","))
        for(var n = 0; n < tags.length; n++){
            updates[toTitleCase(tags[n])] = row[header_row.indexOf(tags[n])].toString()
        }
        changes_to_make[row[staging_npi_index]] = updates
        
     }
    }
  }
  
  Logger.log(npi_to_add)
  Logger.log(changes_to_make)
  
  var npi_to_clear = editLiveSheet(live,npi_to_add,changes_to_make)
  Logger.log(npi_to_clear)
  clearUpdatedRows(staging,npi_to_clear) //for ones that were updated, remove them from the staging space
  
}



function editLiveSheet(live,npi_to_add,changes_to_make){
  var live_state_index = 4
  var live_npi_index = 0
  
  var npi_modified = []
  
  //For each arr in npi_to_add matrix
  //arr.splice(live_state_index,0,'GA')
  for(var i = 0; i < npi_to_add.length; i++){
    var arr = npi_to_add[i]
    arr.splice(live_state_index,0,'GA')
    live.appendRow(arr)
    npi_modified.push(arr[0])
  }
  
  //For each npi in changes_to_make json
  var live_data = live.getDataRange().getValues()
  var header_row = live_data[0]
  
  for(var i = 0; i < live_data.length; i++){
    if(changes_to_make[live_data[i][live_npi_index]]){
      Logger.log(live_data[i])
      var changes = changes_to_make[live_data[i][live_npi_index]]
      
      //Edit appropriately
      for(var prop in changes){
          var col_index = header_row.indexOf(prop)
          live.getRange((i+1),(col_index+1)).setValue(changes[prop])
      }
      
      npi_modified.push(live_data[i][live_npi_index])
      
    }
  }
  
  return npi_modified
  
}




//Clear out rows from the staging area that have been processed and updated appropriately
//on the live sheet
function clearUpdatedRows(staging,npi_to_clear){
  var data = staging.getDataRange().getValues()
  var staging_npi_index = 2
  
  for(var i = data.length - 1; i > 0; i--){
    //if(~ npi_to_clear.indexOf(data[i][staging_npi_index].toString())) staging.getRange((i+1), 1, 1, staging.getMaxColumns()).setBackground('green')
    if(~ npi_to_clear.indexOf(data[i][staging_npi_index].toString())) staging.deleteRow(i+1)
  }
  
}




//Helper to just clear out empty array elements
function removeEmptyElems(arr){
  var res = []
  for(var j = 0; j < arr.length; j++){
    if(arr[j].toString().trim().length > 0) res.push(arr[j].toString().trim())
  }
  return res
}