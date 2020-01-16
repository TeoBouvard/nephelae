

function create_mission_card(mission) {

    let card = document.createElement('div');
    card.setAttribute('id', mission.aircraftId+'_'+mission.missionId);
    card.classList.add('card');
    card.classList.add('blue-grey');
    card.classList.add('darken-1');

    let title = mission.type + ' Aircraft ' + mission.aircraftId
    let html = '';
    html += '<span class="left" >Duration</span>' + 
            '<span class="right">' + mission.duration + '</span><br>';
    html += '<span class="left" >Insertion mode</span><span class="right">'; 
    switch(mission.insertMode) {
        case 0: html += 'Append';         break;
        case 1: html += 'Prepend';        break;
        case 2: html += 'ReplaceCurrent'; break;
        case 3: html += 'ReplaceAll';     break;
        default:
            throw "Fatal error : invalid insertion mode";
    }
    //html += '</span><br><hr>';
    html += '</span><br><br><hr><br>';
    for (let parameterName in mission.parameters) {
        html += '<span class="left" >' + parameterName + '</span>';
        html += '<span class="right">' + mission.parameters[parameterName] +
                '</span><br>';
    }

    card.innerHTML = 
        '<div class="card-content white-text">' +
            '<span class="card-title">'+title+'</span>' +
            html +
        '</div>';

    return card;
}

function create_mission_validation_card(mission) {
    let missionCard = create_mission_card(mission);

    let buttons = document.createElement('div');
    buttons.innerHTML = 
        '<div class="card-action">' +
            '<a href="#" class="reject-button" ' +
                        'aircraftId="'+mission.aircraftId+'" ' + 
                        'missionId="'+mission.missionId+'">Reject</a>' +
            '<a href="#" class="authorize-button" ' +
                        'aircraftId="'+mission.aircraftId+'" ' + 
                        'missionId="'+mission.missionId+'">Authorize</a>' +
        '</div>';
    missionCard.appendChild(buttons);

    return missionCard;
}

