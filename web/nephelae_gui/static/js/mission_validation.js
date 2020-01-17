var pendingMissionsWebSocket = null;

// This is the page init function
$(document).ready( () => {
    removeLoader();

    let mainRow = document.createElement("div");
    mainRow.classList.add("row");
    mainRow.classList.add("main-row");
    //mainRow.classList.add("parent-row");
    $('#main_container')[0].appendChild(mainRow);

    pendingMissionsWebSocket = new WebSocket('ws://' + window.location.host +
        '/ws/pending_missions_update/');
    pendingMissionsWebSocket.onmessage = (e) => {
        console.log("Pending mission update");
        console.log(e);
        refresh_pending_missions();
    };


    refresh_pending_missions();
});


function refresh_pending_missions() {

    let mainRow = $('#main_container .main-row')[0];
    mainRow.innerHTML = "";

    $.getJSON('/aircrafts/pending_missions_all/', (response) => {
        //console.log(response);
        for (let aircraftId in response) {

            let column = document.createElement("div");
            column.classList.add("col");
            column.classList.add("s6");
            mainRow.appendChild(column);
            
            let row = document.createElement("div");
            row.classList.add("row");
            column.appendChild(row);
            for (let mission of response[aircraftId]) {
                row.appendChild(create_mission_validation_card(mission, row));
                let cardId = mission.aircraftId+'_'+mission.missionId;
                $('#' + cardId + ' .authorize-button')[0]
                    .onclick = authorize_mission_clicked;
                $('#' + cardId + ' .reject-button')[0]
                    .onclick = reject_mission_clicked;
            }
        };
    });
}

function authorize_mission_clicked(e) {
    authorize_mission(e.target.attributes.aircraftId.value,
                      e.target.attributes.missionId.value);
    return false; // always return false on clicked event to
                  // "prevent browser to follow link". (?)
}

function reject_mission_clicked(e) {
    reject_mission(e.target.attributes.aircraftId.value,
                   e.target.attributes.missionId.value);
    return false; // always return false on clicked event to
                  // "prevent browser to follow link". (?)
}

function authorize_mission(aircraftId, missionId) {
    $.getJSON('/aircrafts/authorize_mission/'+aircraftId+'/'+missionId,
              (response) => {
        console.log(response);
    });
}

function reject_mission(aircraftId, missionId) {
    $.getJSON('/aircrafts/reject_mission/'+aircraftId+'/'+missionId,
              (response) => {
        console.log(response);
    });
}
