// if this is the first visit of client
if(!Cookies.get('visits')){
    Cookies.set('visits', 1);
} else {
    Cookies.set('visits', parseInt(Cookies.get('visits'))+1);
}