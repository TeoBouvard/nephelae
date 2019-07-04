function open_navbar(){
    var x = document.getElementById("nav");
    if (x.className === "pill-nav") {
        x.className += " responsive";
    } else {
        x.className = "pill-nav";
    }
}