
function testStage(){
  stage([1,2,3,4,5,6,7,8,9,10], SpreadsheetApp.getActiveSpreadsheet(),'TEST')
}


function polishStage(sh){
  
  sh = SpreadsheetApp.getActiveSpreadsheet() //TODO: delete this
  
  var staging = sh.getSheetByName('Staging Area')
  
  //Go through each row, checking the tag, and highlight appropriate cells to make the approval process easy
  
  var data = staging.getDataRange().getValues()
  var first_row = data[0]
  
  
  for(var i = 1; i < data.length; i++){
  
    if(data[i][0].toString().trim() == 'ADD'){
      staging.getRange((i+1), 3,1,staging.getMaxColumns()-2).setBackground('orange')
    } else {
      var tags = data[i][0].split(",")
      for(var n = 0; n < tags.length; n++){
        if(tags[n].length > 0) staging.getRange((i+1), (first_row.indexOf(tags[n]) + 1), 1, 1).setBackground('orange')
      }
    }
  }
  
}



function stage(row,sh, tag){
  
  var staging_area = sh.getSheetByName('Staging Area')
  var reordered_row = [row[0],row[1],row[9],row[2],row[10],row[3],row[11],row[4],row[12],row[5],row[13],row[6],row[14]]
  
  var new_row = [tag,'']
  var reordered_row = [row[0],row[1],row[9],row[2],row[10],row[3],row[11],row[4],row[12],row[5],row[13],row[6],row[14]]
  new_row = new_row.concat(arrTitleCase(reordered_row))
  
  staging_area.appendRow(new_row)
}




function arrTitleCase(arr){
  var res = []
  for(var i = 0; i < arr.length; i++){
    res.push(toTitleCase(arr[i].toString()))
  }
  return res
}
