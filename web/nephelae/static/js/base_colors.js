// Add CSS colors (in order corresponding to icons folder) for more drones
global_colors = ["red", "green", "blue", "purple", "teal", "orange", "lime", "yellow", "fuchsia", "gray"];

// colormap has to be adjusted for the zero value to be white
function thermals_colorscale(zero_value){
    var cmap = [
        [0, 'rgb(0,0,255)'],   
        [zero_value, 'rgb(255, 255, 255)'],
        [1, 'rgb(255,0,0)']
    ];
    return cmap
}

// colormap has to be adjusted for the zero value to be white
function clouds_colorscale(zero_value){
    var cmap = [
        [0, 'rgb(255, 255, 255)'],
        [zero_value, 'rgb(255, 255, 255)'],
        [1, 'rgb(128, 0, 128)']
    ];
    return cmap
}