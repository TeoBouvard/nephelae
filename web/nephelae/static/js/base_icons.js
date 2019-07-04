global_icons = [];

// Icon class
var planeIcon = L.Icon.extend({
    options: { 
        iconSize:     [20, 20], // size of the icon
        iconAnchor:   [10, 10], // marker's location.setView([43.6047, 1.4442], 13);
        popupAnchor:  [0, 0]    // relative to the iconAnchor
    }
});

// Create an icon for each image in the icon folder
for(var i = 0; i < global_colors.length; i++){
    var random_icon = new planeIcon({iconUrl: '/map/plane_icon/' + i})
    global_icons.push(random_icon);
}