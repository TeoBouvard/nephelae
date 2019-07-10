function removeLoader(){
    var element = document.getElementById("loader");
    if (element != null){
        element.parentNode.removeChild(element);
    }
}

$(document).ready(function(){
    M.AutoInit();
});