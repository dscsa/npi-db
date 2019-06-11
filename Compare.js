//Runs after the five raw-generating functions have made all the API calls
//This looks at the comparitive columns (P-U) for any updates to our DB
function compareSheets() {
  var sh = SpreadsheetApp.openById(DB_FILE_ID)
  var new_raw = sh.getSheetByName("Georgia Pharmacies")
  var curr_live = sh.getSheetByName("Live")
  
  var raw_data = new_raw.getDataRange().getValues()
  var live_data = curr_live.getDataRange().getValues()
  
  
  var index_npi = 0
  var index_name = 1
  var index_addr = 2
  var index_city = 3
  var index_zip = 4
  var index_phone = 5
  var index_fax = 6
  
  var index_live_name = 9
  var index_live_addr = 10
  var index_live_city = 11
  var index_live_zip = 12
  var index_live_phone = 13
  var index_live_fax = 14
  
  var index_name_match = 16
  var index_addr_match = 17
  var index_city_match = 18
  var index_zip_match = 19
  var index_phone_match = 20
  var index_fax_match = 21
  
  var index_live_removed = 9
  
  var info_changed = []
  info_changed.push("The following NPIs have modified info:\n")
  var new_npi = []
  new_npi.push("The following NPIs are new:\n")
  var removed_npi = []
  removed_npi.push("The following NPIs seem removed from the Live sheet:\n")

  for(var i = 2; i < raw_data.length; i++){ //Go through the new_raw, looking at columns P-U for any discrepancies
  
    if(raw_data[i][index_name_match].toString().trim() == "N/A"){ //then this is a new NPI
      //NEW NPI
      new_npi.push("NPI: " + raw_data[i][index_npi] + ", " + toTitleCase(clean_up_name_addr(raw_data[i][index_name])) + ", " + toTitleCase(clean_up_name_addr(raw_data[i][index_addr])) + ", " + toTitleCase(raw_data[i][index_city]) + ", " + raw_data[i][index_zip] + ", " + raw_data[i][index_phone] + ", " + raw_data[i][index_fax])
      new_raw.getRange("A" + (i+1) + ":I" + (i+1)).setBackground('orange')
      
      stage(raw_data[i], sh, 'ADD') //send it to staging area to add
      
    } else {
      var str = "Row " + (i+1) + " - NPI " + raw_data[i][index_npi] + ": "
      var found = false //was an actual issue found on this row
      var staging_tag = ''
      
      if(raw_data[i][index_name_match].toString().trim() == "NO"){
        var name_curr = toTitleCase(clean_up_name_addr(raw_data[i][index_name].toString()))
        var name_live = toTitleCase(clean_up_name_addr(raw_data[i][index_live_name].toString())) 
        if(name_curr != name_live){
          str += "Name (" + name_live + " -> " + name_curr + "), "
          staging_tag += 'NAME,'
          found = true
        }
      }
      
      if (raw_data[i][index_addr_match].toString().trim() == "NO"){
        var old_addr = toTitleCase(clean_up_name_addr(raw_data[i][index_live_addr].toString()))
        var new_addr = toTitleCase(clean_up_name_addr(raw_data[i][index_addr].toString()))
        if(old_addr != new_addr){
          str += "Street Address (" + old_addr + " -> " + new_addr + "), "
          found = true
          staging_tag += 'STREET,'

        }
      }
      if (raw_data[i][index_city_match].toString().trim() == "NO"){
        str += "City (" + toTitleCase(raw_data[i][index_live_city]) + " -> " + toTitleCase(raw_data[i][index_city]) + "), "
        found = true
        staging_tag += 'CITY,'

      }
      if (raw_data[i][index_zip_match].toString().trim() == "NO"){
        str += "ZIP (" + raw_data[i][index_live_zip] + " -> " + raw_data[i][index_zip] + "), "
        found = true
        staging_tag += 'ZIP,'

      }
      if ((raw_data[i][index_phone_match].toString().trim() == "NO") && (raw_data[i][index_phone].toString().trim().length > 0)){
        str += "Phone (" + raw_data[i][index_live_phone] + " -> " + raw_data[i][index_phone] + "), "
        found = true
        staging_tag += 'PHONE,'

      }
      if ((raw_data[i][index_fax_match].toString().trim() == "NO") && (raw_data[i][index_fax].toString().trim().length > 0)){
        if(raw_data[i][index_fax].toString() != raw_data[i][index_phone].toString()){
          str += "Fax (" + raw_data[i][index_live_fax] + " -> " + raw_data[i][index_fax] + "), "
          found = true
          staging_tag += 'FAX,'

        }
      } 
      
      if(found){
        info_changed.push(str)
        new_raw.getRange("A" + (i+1) + ":I" + (i+1)).setBackground('orange')
        stage(raw_data[i], sh, staging_tag)
      }
      
    }   
   }
   
 
   //Go through the lvie sheet look at column H
   for(var i = 0; i < live_data.length; i++){ //Go through the new_raw, looking at columns P-U for any discrepancies
      if(live_data[i][index_live_removed].toString().trim() == "N/A"){
        removed_npi.push("Row: " + (i+1) + ": " + live_data[i][index_npi] + ", " + live_data[i][index_name])
        //curr_live.getRange("A" + (i+1) + ":G" + (i+1)).setBackground('orange')
      }
   }
   
   var content = "Hi,\n\nThe last run of updating our NPI Database found the following discrepancies:\n\n"
   content += info_changed.join("\n")
   content += "\n\n"
   content += new_npi.join("\n")
   content += "\n\n"
   content += removed_npi.join("\n")
   
   polishStage(sh)
   MailApp.sendEmail(COMPARE_UPDATE_EMAIL, "NPI DB UPDATE", content)
}




function clean_up_name_addr(str){
  str = str.toUpperCase().replace(/SUITE/g,"STE").replace(/  /g," ").replace(/-/g,"").replace(/STREET/g,"St")
  str = str.replace(/\./g,"").replace(/,/g,"").replace(/LLC/g,"").replace(/INC/g,"").replace("# ","#")
  str = str.replace(/ ROAD /g,"RD").replace(/HIGHWAY/g,"HWY").replace(/AVENUE/g,"AVE").replace(/ AND /g," & ")
  return str.trim()
}



function toTitleCase(str){
  str = str.toString().toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
  }
  return str.join(' ');
}