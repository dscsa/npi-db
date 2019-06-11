function main(){ 
    var ss = SpreadsheetApp.openById(DB_FILE_ID)
    var raw_sheet = ss.getSheetByName("Georgia Pharmacies")
    raw_sheet.copyTo(ss)
    SpreadsheetApp.flush()
    
    var old_sheet = ss.getSheetByName("Copy of Georgia Pharmacies")
    var time_stamp = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd").toString()
    old_sheet.setName("BACKUP - " + time_stamp)
    
    raw_sheet.deleteRows(3, raw_sheet.getLastRow() - 2) //leave row 2, otherwise array functions freak tf out
    raw_sheet.getRange(2, 1, 1, raw_sheet.getMaxColumns()).clearContent()
    SpreadsheetApp.flush()
    
    //TODO: here, based on something - batch parts of zip code so we don't hit a limit
    populateRawSheet(1)
}



//Formulates call to the restful API, then calls addRows to actually save new data
function populateRawSheet(code){
  
  var raw_sheet = SpreadsheetApp.openById(DB_FILE_ID).getSheetByName("Georgia Pharmacies")
  var zip_codes = build_zip_code_array()
  
  var url = "https://npiregistry.cms.hhs.gov/api/resultsDemo2/?number=&enumeration_type=NPI-2&taxonomy_description=Pharmacy*&first_name=&last_name=&organization_name=&address_purpose=&city=&state=GA&postal_code="
  var url_end = "&country_code=&limit=200&skip="
  var final_res_arr = []
  
  for(var i = 0; i < zip_codes.length; i++){
      var num_skip = 0

      var zip_code = zip_codes[i]
      
      var temp_url = url + zip_code + url_end + num_skip
      var response = UrlFetchApp.fetch(temp_url, {'muteHttpExceptions': true});
      
      var obj_response = JSON.parse(response)
      var count = obj_response['result_count']
      var temp_res = buildRows(obj_response, raw_sheet, zip_code)
      final_res_arr = final_res_arr.concat(temp_res)
      
      while((count == 200) && (num_skip < 1000)){ //then repeat to keep getting more
        num_skip += count
        temp_url = url + zip_code + url_end + num_skip
        response = UrlFetchApp.fetch(temp_url, {'muteHttpExceptions': true});
        obj_response = JSON.parse(response)
        var temp_res = buildRows(obj_response, raw_sheet,zip_code)
        final_res_arr = final_res_arr.concat(temp_res)
        count = obj_response['result_count']
        Logger.log(count)
      }
      
      if((final_res_arr.length > 0) && ((i % 50) == 0)){ //TODO comp i against 100
          var last_row = appendRows(raw_sheet,final_res_arr)
          final_res_arr = []
      }
  }
  
  if(final_res_arr.length > 0){
    var last_row = appendRows(raw_sheet,final_res_arr)
  }
}





//Builds an array of the zip codes for Georgia
function build_zip_code_array(){
  
  var res = []
  for(var i = 30002; i < 32000; i++){
    res.push(i.toString())
  }
    
  res = res.concat(['39813','39815','39817','39818','39819','39823','39824','39825','39826','39827',
  '39828','39829','39832','39834','39836','39837','39840','39841','39842','39845','39846','39851','39852','39854',
  '39859','39861','39862','39866','39867','39870','39877','39885','39886','39897','39901'])
  
  return res //TODO: remove slice
}





//Takes a result from the JSON and process it to add to the raw sheet if it's complete
function buildRows(obj_resp, raw_sheet, zip_code){


  var results = obj_resp['results']
  //look at repo for ex
  var name = "" //of facility
  var addr = "" //street or mailing address, included in output
  var city = ""
  var phone = ""
  var fax = ""
  var desc = "" //taxonomy description, what kind of pharmacy
  var person = "" //official regitered
  var npi = ""
  
  
  var last_npi = "" //keep track so we don't duplicate 
  var res_arr = [] //going to be a 2d array
  
  for(var i = 0; i < results.length; i++){
  
    var res = results[i]
    
    if(res['other_names'].length > 0){
      name = res['other_names'][0]['organization_name']
    } else {
      name = res['basic']['name']
    }
        
    
    if(true){
      npi = res['number']
      if(npi != last_npi){
        var addresses = res['addresses']
        var curr_addr = addresses[0]
        if(curr_addr['postal_code'].slice(0,5) == zip_code){ //only look at locations in our zip, this excludes the hq in alot
            city = curr_addr['city']
            addr = curr_addr['address_1']
            phone = curr_addr['telephone_number']
            if(typeof phone === "undefined"){
                phone = ""
            }
            fax = curr_addr['fax_number']
            if(typeof fax === "undefined"){
                fax = ""
            }
            res_arr.push([npi,name,addr,city,zip_code,phone,fax])
        }
        last_npi = npi
     }
   }
 }
 
 return cleanDuplicates(res_arr)
}


function testclean(){
  Logger.log(cleanDuplicates([['one','row one','addr'],['two','row twotwo','addr'],['three','row three','addy']]))
}



//Given an matrix (Array of arrays of results), will look for duplicates around address (index 2 of a row array)
//Doesn't do a thorough search for duplciates, because there are efficiency shortcuts
//Primarily: duplicates will be near each other in the matrix (usually right next to each other)
function cleanDuplicates(matrix){
  var res = []
  var mini_cache = {}
  
  for(var i = 0; i  < matrix.length; i++){
  
    if(Object.keys(mini_cache).length == 5){
      for(var key in mini_cache){
        res.push(mini_cache[key])
      }
      mini_cache = {}
    }
    
    if(mini_cache[matrix[i][2].toString().trim().toLowerCase()]){ //then we already have this address
      var existing_val = mini_cache[matrix[i][2].toString().trim().toLowerCase()]
      
      if(existing_val[1].length < matrix[i][1].length){ //then overwrite other value,
        mini_cache[matrix[i][2].toString().trim().toLowerCase()] = matrix[i] //then store in mini cache under address as key
      } //else we just ignore this row
      
    } else { //if we don't have this in minicache, then def add to it
      mini_cache[matrix[i][2].toString().trim().toLowerCase()] = matrix[i] //then store in mini cache under address as key
    }

  }
  
  if(Object.keys(mini_cache).length > 0){
    for(var key in mini_cache){
      res.push(mini_cache[key])
    }
  }
  
  Logger.log(mini_cache)
  return res

}


//Appends multiple rows at once (much faster than doing so individually)
function appendRows(sheet,two_d_arr){
  Logger.log(two_d_arr)
  var last_full_row = sheet.getLastRow();
  sheet.insertRowsAfter(last_full_row, two_d_arr.length); //add empty rows
  sheet.getRange(last_full_row, 1, two_d_arr.length, two_d_arr[0].length).setValues(two_d_arr);
  return last_full_row
}



