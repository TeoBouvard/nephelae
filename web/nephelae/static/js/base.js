function removeLoader(){
    var element = document.getElementById("loader");
    if (element != null){
        element.parentNode.removeChild(element);
    }
}

function open_navbar(){
    var x = document.getElementById("nav");
    if (x.className === "pill-nav") {
        x.className += " responsive";
    } else {
        x.className = "pill-nav";
    }
}
