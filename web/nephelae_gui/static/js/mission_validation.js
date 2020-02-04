const pendingMissionsSocket = new Refresher(refreshTypes.MISSION_CREATION,
    addMissionPending);
const validateMissionsSocket = new Refresher(refreshTypes.MISSION_VALIDATION,
    removeMissionPending);

// This is the page init function
$(document).ready( () => {
    removeLoader();

    let mainRow = document.createElement("div");
    mainRow.classList.add("row");
    mainRow.classList.add("main-row");
    //mainRow.classList.add("parent-row");
    $('#main_container')[0].appendChild(mainRow);

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
            row.id = aircraftId + '_missions';
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

function addMissionPending(response){
    var query = $.param(response);
    $.ajax({
        dataType: 'JSON',
        url: 'get_state_mission/?' + query,
        success: function(mission){
            let row = $('#'+ mission.aircraftId+'_missions');
            row.append(create_mission_validation_card(mission, row));
            let cardId = mission.aircraftId+'_'+mission.missionId;
            $('#' + cardId + ' .authorize-button')[0]
                .onclick = authorize_mission_clicked;
            $('#' + cardId + ' .reject-button')[0]
                .onclick = reject_mission_clicked;
        },
    });
}

function removeMissionPending(response){
    let cardId = $('#'+response.aircraft_id+'_'+response.mission_id);
    cardId.remove();
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
        var obj_id = {aircraft_id: aircraftId, mission_id: missionId};
        Refresher.sendRefreshSignal(obj_id, validateMissionsSocket.type);
        Refresher.sendRefreshSignal(obj_id, refreshTypes.MISSION_UPDATE);
    });
}

function reject_mission(aircraftId, missionId) {
    $.getJSON('/aircrafts/reject_mission/'+aircraftId+'/'+missionId,
              (response) => {
        var obj_id = {aircraft_id: aircraftId, mission_id: missionId};
        Refresher.sendRefreshSignal(obj_id, validateMissionsSocket.type)
        Refresher.sendRefreshSignal(obj_id, refreshTypes.MISSION_UPDATE);
    });
}
