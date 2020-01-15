// This is the page init function
$(document).ready( () => {
    removeLoader();

    let dom = document.createElement("div");
    dom.innerHTML = "Not implemented yet";
    $('#main_container')[0].appendChild(dom);

    $.getJSON('/aircrafts/pending_missions_all/', (response) => {
        console.log(response);
    });
});


