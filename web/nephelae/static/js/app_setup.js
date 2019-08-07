// if this is the first visit of client, set default parameters
if(!Cookies.get('visits')){
    Cookies.set('visits', 1);
    setDefaultParameters();
} else {
    Cookies.set('visits', parseInt(Cookies.get('visits'))+1);
}

function setupParameters() {

}