
var mission_creation_parameters = {
    aircrafts : {}
}

class Callable extends Function {
	constructor(callback, ...args) {
		super('return arguments.callee._call.apply(arguments.callee, arguments)')
		this.callback_ = callback;
		this.args_	   = args;	
	}
	
	_call() {
		this.callback_(...this.args_);
	}
}

function init_mission_modals() {

    console.log($('.mission-modal-trigger'));
    for (button of $('.mission-modal-trigger')) {
        var aircraftId = button.attributes.aircraft.value;
        var modal = create_mission_modal(aircraftId);

        button.classList.add('modal-trigger');
        button.setAttribute('href', '#' + modal['id']);

        var modalContent = document.createElement('div');
        modalContent.innerHTML = modal['html'];
        button.parentNode.appendChild(modalContent.firstChild);
        
        // Calling fill_mission_modal on modal open
        $('#'+modal['id']).modal({
            onOpenStart : new Callable(new_mission_element_clicked, aircraftId)});
    }
}

//function test_function(

function create_mission_modal(aircraftId) {
    html  = '<div id="modal_'+aircraftId+'" class="modal modal-fixed-footer">';
    html +=     '<div class="modal-content black-text">';
    html +=         '<h4>Create mission for aircraft '+aircraftId+'</h4>';
    html +=         '<p><div id="mission_input_'+aircraftId+'"></div></p>';
    html +=     '</div>';
    html +=     '<div class="modal-footer">';
    html +=         '<a href="#!" class="modal-close waves-effect waves-green btn-flat">Cancel</a>';
    html +=         '<a href="#!" class="waves-effect waves-green btn-flat" onclick="create_mission('+aircraftId+')">Create</a>';
    html +=     '</div>';
    html += '</div>';

    return {id : 'modal_' + aircraftId, html : html};
}


function new_mission_element_clicked(aircraftId) {
    $.getJSON('/aircrafts/available_missions/'+aircraftId, (response) => {

        if (response.mission_types.length <= 0) {
            var newHtml = '<span class="left">No missions defined for this aircraft.</span>';
            $('#mission_input_' + aircraftId).html(newHtml);
        }
        else
        {
            // Building drop down list to select mission
            var newHtml = '<br><div class="input-field">';
            newHtml += '<select id="mission_selector" name="Mission Type">';
            for (missionType of response.mission_types) {
                newHtml += '<option value='+missionType+'>'+missionType+'</option>';
            }
            newHtml += '</select>';
            newHtml += '<label>Mission type</label>';
            newHtml += '</div><br>';
            
            // Creating div for parameter input to be filled by mission_selected
            newHtml += '<div id="mission_params"></div>';
            
            $('#mission_input_' + aircraftId).html(newHtml);

            //  materialize select needs initialization
            $('select').formSelect();
            
            // Binding select to select_mission callback
            $('#mission_input_'+aircraftId+' #mission_selector')[0]
                .onchange= new Callable(mission_selected, aircraftId);
            // Calling select_mission once to initialize
            mission_selected(aircraftId);
        }
    });
}

function mission_selected(aircraftId) {
    var inputId = '#mission_input_'+aircraftId;
    var missionType = $(inputId + ' #mission_selector')[0].value;
    $.getJSON('/aircrafts/mission_parameters/'+aircraftId+'/'+missionType,
              (response) =>{

        var html = '<div class="input-field col s12">';
        html += '<select id="insert_mode_selector" name="Insert Mode">';
        html +=     '<option value=0>Append</option>';
        html +=     '<option value=1>Prepend</option>';
        html += '</select>';
        html += '<label>Insert mode</label>';
        html += '</div>';
        html += '<div id="div_duration" class="input-field col s12">' +
                    '<input id="duration" type="text" class="validate">' + 
                    '<label id="duration_label" for="duration">Duration</label>' +
                '</div>';
        currentParameterNames = [];
        for (parameterName of response.parameter_names) {
            html += '<div id="div_'+parameterName+'" class="input-field col s12">' +
                        '<input id="'+parameterName+'" type="text" class="validate">' + 
                        '<label id="'+parameterName+'_label" for="'+parameterName+'">'+parameterName+'</label>' +
                    '</div>';
            currentParameterNames.push(parameterName);
        }
        $(inputId + ' #mission_params').html(html);

        // Setting a default value for duration input field
        $(inputId + ' #duration')[0].value='-1.0';
        // This is to show the label correctly (overwise overlap with value on display)
        $(inputId + ' #duration_label')[0].classList.add('active');

        // Setting default values for parameter fields when given
        for (parameterName of response.parameter_names) {
            if (!(parameterName in response.parameter_rules))
                continue;
            if (!('default' in response.parameter_rules[parameterName]))
                continue;

            // Setting a default value for this parameter
            $(inputId + ' #'+parameterName)[0].value = String(response.parameter_rules[parameterName]['default']);
            // This is to show the label correctly (overwise overlap with value on display)
            $(inputId + ' #'+parameterName+'_label')[0].classList.add('active');
        }

        $('input#input_text, textarea#textarea2').characterCounter();
        $('select').formSelect();
    });
}

function create_mission(aircraftId) {
    var missionInput = '#mission_input_'+aircraftId;
    
    var query = {};
    query['aircraftId']  = aircraftId;
    query['missionType'] = $(missionInput + ' #mission_selector')[0].value;
    query['insertMode']  = $(missionInput + ' #insert_mode_selector')[0].value;
    query['duration']    = $(missionInput + ' #duration')[0].value;
    for (parameterName of currentParameterNames) {
        query['params_' + parameterName] = $(missionInput + ' #' + parameterName)[0].value;
    }

    $.getJSON('/aircrafts/create_mission/?' + $.param(query), (response) => {
        console.log(response);
    });
}


