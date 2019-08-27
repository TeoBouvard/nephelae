$(document).ready(function(){
    // Initialize materialize objects
    M.AutoInit();
    $('#draggable').draggable({ 
        scroll:false, 
        containment: ['parent'],
        handle: "i",
        axis: "y",
    });
});

