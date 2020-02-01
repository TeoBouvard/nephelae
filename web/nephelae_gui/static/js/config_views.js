var cy = undefined;
var graph = {};
var nodeSocket = {};
var edgeSocket = {};

$(document).ready(() => {
    setSockets();
    getGraphJSON();
    initTree();
    removeLoader();
});


function getGraphJSON(){
    $.ajax({
        dataType: 'JSON',
        url: 'get_graph_dataviews/',
        success: function(d){graph = d;},
        async: false
    });
}

function initTree(){
    cy = cytoscape({
        container: $('#tree-views'),
        style: [
            {
                selector: 'node',
                style:{
                    'width': '140px',
                    'height': '80px',
                    'shape': 'rectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': '60px',
                    'text-halign': 'center',
                    'text-valign': 'center',
                    'label': 'data(name)',
                },
            },
        ],
        userZoomingEnabled: false,
    });
    let cy_graph = [];
    for (node in graph.nodes){
        cy_graph.push({group: 'nodes', data: {id: node, name: graph.nodes[node].name}});
    }
    for (edge in graph.edges){
        cy_graph.push({group: 'edges', data: {id: edge, 
            source: graph.edges[edge].source,
            target: graph.edges[edge].target}});
    }
    cy.add(cy_graph);
    var cy_layout = cy.layout({name: 'breadthfirst'});
    cy_layout.run();
    cy.fit();
    for (node in graph.nodes){
        if (Object.keys(graph.nodes[node].updatable).length != 0)
            setupNode(node);
    }
    for (edge in graph.edges){
        setupEdge(edge);
    }
    //setupNode('View1');
}

function setupNode(id){
    createModalNode(id);
    $('#modal_'+id).modal();
    cy.$('#'+id).on('tap', toggleModal);
    cy.$('#'+id).style('background-color', 'blue');
}

function setupEdge(id){
    createModalEdge(id);
    $('#modal_'+id).modal();
    cy.$('#'+id).on('tap', toggleModal);
    if (graph['edges'][id].connected){
        cy.$('#'+id).style('lineColor', 'blue');
    } else {
        cy.$('#'+id).style('lineColor', 'black');
    }
}

function toggleModal(evt){
    var id = this.id();
    let modal = $('#modal_'+id);
    modal.modal('open');
}

function createModalEdge(id){
    let html = '<div id="modal_'+id+'" class="modal modal-fixed-footer">';
    let object = graph['edges'][id];
    html += '<div class="modal-content black-text">' +
        '<span class="left"><h4>Switch state for this edge ?</h4></span>' +
        '<br><br><br><hr><br><p></div>';
    html += '<div class="modal-footer">' +
                '<a href="#!" class="modal-close waves-effect waves-green btn-flat">Cancel</a>' +
                '<a href="#!" id="validation_'+id+'" class="modal-close waves-effect waves-green btn-flat">Switch</a>' +
            '</div>';
    html += '</div>';
    $('body').append(html);
    $('#validation_'+id).click(function(){sendEdge(id);});
}

function createModalNode(id){
    let html = '<div id="modal_'+id+'" class="modal modal-fixed-footer">';
    let object = graph['nodes'][id];
    html += '<div class="modal-content black-text">' +
        '<span class="left"><h4>Modify parameters for view '+id+'</h4></span>' +
        '<br><br><br><hr><br><p>';
    for (key in object.updatable){
        html += '<div class="row">'
        html += '<div class="input-field col s12">';
        html += '<input type="number" step="0.001" placeholder="'+object.updatable[key]+'" id="'+id+'_'+key+'" class="validate">';
        html += '<label for="'+id+'_'+key+'" class="active" style="font-size:20px;">'+prettifyString(key)+'</label>';
        html += '</div></div>';
    }
    html += '</div>';
    html += '<div class="modal-footer">' +
                '<a href="#!" class="modal-close waves-effect waves-green btn-flat">Cancel</a>' +
                '<a href="#!" id="validation_'+id+'" class="modal-close waves-effect waves-green btn-flat">Validate</a>' +
            '</div>';
    html += '</div>';
    $('body').append(html);
    $('#validation_'+id).click(function(){updateView(id);});
}

function updateView(id){
    let object = graph['nodes'][id];
    query_dict = {view_id: id};
    for(key in object.updatable){
        let value = $("#"+id+"_"+key).val();
        if (value != ''){
            $("#"+id+"_"+key).attr("placeholder", value);
            graph['nodes'][id].updatable[key] = value;
            query_dict[key] = graph['nodes'][id].updatable[key];
            $("#"+id+"_"+key).val('');
        }
    }
    var query = $.param(query_dict);
    $.ajax({
        dataType: 'JSON',
        url: 'change_parameters_view/?' + query,
        async: false
    });
}

function sendEdge(id){
    var query = $.param({edge_id: id})
    $.ajax({
        dataType: 'JSON',
        url: 'switch_state_edge/?' + query,
        success: function(){sendRefreshSignal(id, edgeSocket);},
    });
}

function updateEdge(response){
    var query = $.param({edge_id: response.id});
    console.log(response)
    $.ajax({
        dataType: 'JSON',
        url: 'get_state_edge/?' + query,
        success: function(d){graph['edges'][response.id].connected = d.state},
        async: false
    });
    if (graph['edges'][response.id].connected){
        cy.$('#'+response.id).style('lineColor', 'blue');
    } else {
        cy.$('#'+response.id).style('lineColor', 'black');
    }
}

function prettifyString(ugly_string){
    var pretty_string = ugly_string.charAt(0).toUpperCase() + ugly_string.slice(1);
    pretty_string.replace(/_/g, ' ');
    return pretty_string
}

function setSockets(){
    edgeSocket['type'] = refreshTypes.EDGE;
    edgeSocket['socket'] = new WebSocket('ws://' +  window.location.host +
        '/ws/refresh_notifier/' + edgeSocket['type'] + '/');
    edgeSocket['socket'].onmessage = (e) => updateEdge(
        JSON.parse(e.data));
    nodeSocket['socket'] = new WebSocket('ws://' +  window.location.host +
        '/ws/refresh_notifier/'+ nodeSocket['type'] +'/');
    nodeSocket['socket'].onmessage = (e) => updateNode(
        JSON.parse(e.data));
    nodeSocket['type'] = refreshTypes.NODE;
}
