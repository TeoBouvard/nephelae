// Do a couple things once window is loaded
window.onload = function(){
    M.AutoInit();
    removeLoader();
}

function removeLoader(){
    var element = document.getElementById("loader");
    element.parentNode.removeChild(element);
}

function open_navbar(){
    var x = document.getElementById("nav");
    if (x.className === "pill-nav") {
        x.className += " responsive";
    } else {
        x.className = "pill-nav";
    }
}
