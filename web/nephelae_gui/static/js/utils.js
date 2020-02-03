// Add CSS colors (in order corresponding to plane_icons folder) for more UAV colors
global_colors = ["red", "green", "blue", "purple", "teal", "orange", "lime", "yellow", "fuchsia", "gray"];
global_icons = [];

const refreshTypes = {
    VIEW: 'view',
    NODE: 'view',
    EDGE: 'edge',
    MISSION_CREATION: 'mission_creation',
};

class Refresher {
    constructor(type, onMessageFunc) {
        this.type = type;
        this.socket = new WebSocket('ws://' +  window.location.host +
        '/ws/refresh_notifier/' + this.type + '/');
        this.socket.onmessage = function(e) {onMessageFunc(JSON.parse(e.data))};
    }

    static sendRefreshSignal(id_obj, type){
        var query_dict = {type: type}
        switch(type){
            case refreshTypes.VIEW:
            case refreshTypes.NODE:
                    query_dict['view_id'] = id_obj['view_id'];
                break;
            case refreshTypes.EDGE:
                    query_dict['edge_id'] = id_obj['edge_id'];
                break;
            case refreshTypes.MISSION_CREATION:
                    query_dict['mission_id'] = id_obj['mission_id'];
                    query_dict['aircraft_id'] = id_obj['aircraft_id'];
                break;
            default:
                throw type + ' is not a defined Refresher Type !';
        }
        var query = $.param(query_dict);
        $.ajax({
            dataType: 'JSON',
            url: '/send_refresh_signal/?' + query,
        });
    }
}

// Icon class
var planeIcon = L.Icon.extend({
    options: { 
        iconSize:     [20, 20], // size of the icon
        iconAnchor:   [10, 10], // marker's location.setView([43.6047, 1.4442], 13);
        popupAnchor:  [0, 0]    // relative to the iconAnchor
    }
});

L.ImageOverlay.include({ // to be included in your script before instantiating image overlays.
    getBounds: function () {
        return this._bounds;
    }
});

// Create an icon for each image in the icon folder
for(var i = 0; i < global_colors.length; i++){
    var random_icon = new planeIcon({iconUrl: '/map/plane_icon/' + i})
    global_icons.push(random_icon);
}

function get_plane_icon(color){
    return new planeIcon({iconUrl: '/map/generated_plane_icon/' + color.substr(1,color.length-1)});
}


function createLayout(variable, values=[]){

    var min_value = getMin(values);
    var max_value = getMax(values);
    var zero_value = (min_value != max_value) ? Math.abs(min_value / (max_value - min_value)) : 0.5;
    var cmap, title;

    switch(variable){
        case "WT":
            cmap = thermals_colormap(zero_value);
            title = 'Vertical wind in m/s';
            break;
        case "RCT":
            cmap = clouds_colormap(zero_value);
            title = "Liquid Water Content in kg/kg"
            break;
        default:
            cmap = 'Viridis';
            title = variable
            break;
    }

    return {'cmap': cmap, 'title': title}  
}

// colormap has to be adjusted for the zero value to be white
function thermals_colormap(zero_value){
    var cmap = [
        [0, 'rgb(0,0,255)'],   
        [zero_value, 'rgb(255, 255, 255)'],
        [1, 'rgb(255,0,0)']
    ];
    return cmap
}

// colormap has to be adjusted for the zero value to be white
function clouds_colormap(zero_value){
    var cmap = [
        [0, 'rgb(255, 255, 255)'],
        [zero_value, 'rgb(255, 255, 255)'],
        [1, 'rgb(128, 0, 128)']
    ];
    return cmap
}

// Utility functions to get min/max of multidimensional arrays
function getMax(a){
    return Math.max(...a.map(e => Array.isArray(e) ? getMax(e) : e));
}

function getMin(a){
    return Math.min(...a.map(e => Array.isArray(e) ? getMin(e) : e));
}

// Helper function to get all 'true' checkboxes of a container
function getSelectedElements(container) {

    var selectedElements = [];

    for(element in container){
        if (container[element] == true) selectedElements.push(element);
    }

    return selectedElements;
}

// Converts numeric degrees to radians //
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * (Math.PI / 180);
  }
}

// Removes the spinning loader (has to be called when important elements are loaded)
function removeLoader(){
    var element = document.getElementById("loader");
    if (element != null){
        element.parentNode.removeChild(element);
    }
}
