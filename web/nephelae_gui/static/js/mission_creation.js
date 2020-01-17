
var mission_creation_parameters = {
    aircrafts : {}
}

//var missionModalEndl = '';
//var missionModalEndl = '<br>';
var missionModalEndl = '<hr style="height:0px; visibility:hidden;" />'

class Callable extends Function {
    constructor(callback, ...args) {
        super('return arguments.callee._call.apply(arguments.callee, arguments)')
        this.callback_ = callback;
        this.args_     = args;    
    }
    
    _call() {
        this.callback_(...this.args_);
    }
}

function init_mission_modals() {
    
    //console.log("init mission modal");
    for (button of $('.mission-modal-trigger')) {
        //console.log(button);
        let buttonId = button.attributes.id.value;
        let modal = mission_modal_html(buttonId);

        button.classList.add('modal-trigger');
        button.setAttribute('href', '#' + modal['id']);

        let modalContent = document.createElement('div');
        modalContent.innerHTML = modal['html'];
        $('.modal_container')[0].parentNode.appendChild(modalContent.firstChild);
        
        // Calling fill_mission_modal on modal open
        $('#'+modal['id']).modal({
            onOpenStart : new Callable(mission_modal_on_open, buttonId)});
    }
}

function mission_modal_html(buttonId) {
    let html = 
        '<div id="modal_'+buttonId+'" class="modal modal-fixed-footer">' +
            '<div class="modal-content black-text">' +
                '<span class="left"><h4>Create mission for aircraft</h4></span>' +
                '<span class="right aircraft-selector-container"></span>' +
                '<br><br><br><hr><br><p>' + 
                    '<div class="mission-selector-container input-field col s12"></div>' + missionModalEndl +
                    '<div class="insert-selector-container input-field col s12"></div>' + missionModalEndl +
                    '<div class="duration-container input-field col s12"></div>' + missionModalEndl +
                    '<div class="parameter-container"></div>' +
                '</p>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<a href="#!" class="modal-close waves-effect waves-green btn-flat">Cancel</a>' +
                '<a href="#!" class="modal-close waves-effect waves-green btn-flat" ' +
                'onclick="create_mission('+buttonId+')">Create</a>' +
            '</div>' +
        '</div>';

    return {id : 'modal_' + buttonId, html : html};
}

function mission_modal_on_open(buttonId) {

    let id = 'modal_' + buttonId;
    $.getJSON('/discover/', (response) => {
        let selectorOptions = '';
        for (let aircraftId  in response.uavs) {
            selectorOptions +=
                '<option value='+aircraftId+'>'+aircraftId+'</option>';
        }
        let html =
            '<div class="select-field">' + 
                '<select class="aircraft-selector">' +
                    selectorOptions +
                '</select>' +
            '</div>';
        $('#'+id+' .aircraft-selector-container')[0].innerHTML = html;
        $('select').formSelect(); //Initialize selector
        
        if ($('#'+buttonId)[0].hasAttribute('aircraft')) {
            $('#'+id+' .aircraft-selector')[0].value = 
                $('#'+buttonId)[0].attributes.aircraft.value;
        }

        $('#'+id+' .aircraft-selector')[0]
            .onchange = new Callable(aircraft_selected, buttonId);
        aircraft_selected(buttonId);
    });
}

function aircraft_selected(buttonId) {

    let id = 'modal_' + buttonId;
    let aircraftId = $('#'+id+' .aircraft-selector')[0].value;

    $.getJSON('/aircrafts/available_missions/'+aircraftId, (response) => {

        if (response.mission_types.length <= 0) {
            $('#'+id+' .mission-selector-container')[0].innerHTML = 
                '<span class="left"><h5>No missions defined for this aircraft.</h5></span>';
            return;
        }

        let selectorOptions = '';
        for (let missionType of response.mission_types) {
            selectorOptions +=
                '<option value='+missionType+'>'+missionType+'</option>';
        }
        let html =
            '<select class="mission-selector">' +
                selectorOptions +
            '</select>' +
            '<label>Mission Type</label>';

        $('#'+id+' .mission-selector-container')[0].innerHTML = html;
        $('select').formSelect(); //Initialize selector
        $('#'+id+' .mission-selector')[0]
            .onchange = new Callable(mission_selected, buttonId);
        mission_selected(buttonId);
    });
}

function mission_selected(buttonId) {
    
    let button = $('#'+buttonId)[0];

    let id = 'modal_' + buttonId;
    let aircraftId  = $('#'+id+' .aircraft-selector')[0].value;
    let missionType = $('#'+id+'  .mission-selector')[0].value;

    let html = 
        '<select class="insert-mode" name="Insert Mode">' +
            '<option value=0>Append</option>' +
            '<option value=1>Prepend</option>' +
            '<option value=2>Replace Current</option>' +
            '<option value=3>Replace All</option>' +
        '</select>' +
        '<label>Insert mode</label>';
    $('#'+id+' .insert-selector-container')[0].innerHTML = html;

    html = '<input class="duration" type="text" class="validate">' + 
           '<label class="parameter-label">Duration</label>';
    $('#'+id+' .duration-container')[0].innerHTML = html;
    // Default duration always infinite
    $('#'+id+ ' .duration')[0].value='-1.0';
    
    $.getJSON('/aircrafts/mission_parameters/'+aircraftId+'/'+missionType,
              (response) =>{
        
        let parameterNames = []
        let html = '';
        for (parameterName of response.parameter_names) {
            html +=
                '<div class="input-field col s12">' +
                    '<input name="'+parameterName+'" class="parameter" type="text" class="validate">' + 
                    '<label class=parameter-label>'+parameterName+'</label>' +
                '</div>' + missionModalEndl;
        }
        $('#'+id+' .parameter-container')[0].innerHTML = html;
        // Setting default values for parameter fields when given
        for (parameterName of response.parameter_names) {
                
            // checking if parameter have rules.
            if (!(parameterName in response.parameter_rules))
                continue;

            // Checking if parameter has a position3d tag and fill it with
            // button position3d attribute
            if (response.parameter_tags[parameterName].includes('position3d') &&
                    button.hasAttribute('position3d')) {
                $('#'+id+ ' [name="'+parameterName+'"]')[0].value =
                    button.attributes.position3d.value;
                continue; // Ignoring default value if position3d given
            }

            // Setting a default value for this parameter
            if ('default' in response.parameter_rules[parameterName])
                $('#'+id+ ' [name="'+parameterName+'"]')[0].value =
                    String(response.parameter_rules[parameterName]['default']);
        }
        

        // This is to show the labels correctly
        // (overwise overlap with value on display)
        for (let label of $('#'+id+ ' .parameter-label')) {
            label.classList.add('active');
        }

        $('input#input_text, textarea#textarea2').characterCounter();
        $('select').formSelect();
    });
}

function create_mission(buttonId) {

     // This function is supposed to get an id string. Investigate why we get
     // the object instead. (Javascript ????)

    buttonId = buttonId.attributes.id.value;
    let id = 'modal_' + buttonId;

    let query = {};
    query['aircraftId']  = $('#'+id+' .aircraft-selector')[0].value;
    query['missionType'] = $('#'+id+'  .mission-selector')[0].value;
    query['insertMode']  = $('#'+id+ ' .insert-mode')[0].value
    query['duration']    = $('#'+id+ ' .duration')[0].value
    for (parameter of $('#'+id+' .parameter')) {
        query['params_' + parameter.attributes.name.value] = parameter.value;
    }

    $.getJSON('/aircrafts/create_mission/?' + $.param(query), (response) => {
        console.log(response);
    });
}


