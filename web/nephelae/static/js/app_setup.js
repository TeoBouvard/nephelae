// if this is the first visit of client, set default parameters, else increment visits
if(!Cookies.get('visits')){
    Cookies.set('visits', 1);
    setDefaultParameters();
} else {
    Cookies.set('visits', parseInt(Cookies.get('visits'))+1);
}

function setDefaultParameters() {
    Cookies.set('refresh_rate', 1000);
    Cookies.set('trail_length', 60);
}