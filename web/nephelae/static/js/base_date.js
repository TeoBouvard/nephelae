// Print formatted string from secs
function secToDate(epoch_year, secs){
    var t = new Date(epoch_year, 0, 1); // Epoch of dataset
    t.setSeconds(secs);
    var formatted_date = apz(t.getHours()) + ":"
                   + apz(t.getMinutes()) + ":"
                   + apz(t.getSeconds());
    return formatted_date;
}

// Append leading zeros in date strings
function apz(n){
    if(n <= 9){
      return "0" + n;
    }
    return n
}