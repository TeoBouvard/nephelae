var cy = undefined;
var graph = {};

$(document).ready(() => {
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
                    'width': '80px',
                    'height': '40px',
                    'shape': 'rectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': '60px',
                    'text-halign': 'center',
                    'text-valign': 'center',
                    'label': 'data(id)',
                },
            },
        ],
        userZoomingEnabled: false,
    });
    let cy_graph = [];
    for (node in graph.nodes){
        cy_graph.push({group: 'nodes', data: {id: node}});
    }
    for (edge in graph.edges){
        cy_graph.push({group: 'edges', data: graph.edges[edge]});
    }
    cy.add(cy_graph);
    var cy_layout = cy.layout({name: 'breadthfirst'});
    cy_layout.run();
    cy.fit();
    for (node in graph.nodes){
        if (Object.keys(graph.nodes[node]).length != 0)
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
    $('#validation_'+id).click(function(){updateEdge(id);});
}

function createModalNode(id){
    let html = '<div id="modal_'+id+'" class="modal modal-fixed-footer">';
    let object = graph['nodes'][id];
    html += '<div class="modal-content black-text">' +
        '<span class="left"><h4>Modify parameters for view '+id+'</h4></span>' +
        '<br><br><br><hr><br><p>';
    for (key in object){
        html += '<div class="row">'
        html += '<div class="input-field col s12">';
        html += '<input type="number" step="0.001" placeholder="'+object[key]+'" id="'+id+'_'+key+'" class="validate">';
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
    let object = items[id];
    for(key in object){
        let value = $("#"+id+"_"+key).val();
        if (value != ''){
            $("#"+id+"_"+key).attr("placeholder", $("#"+id+"_"+key).val());
            $("#"+id+"_"+key).val('');
        }
    }
}

function updateEdge(id){
    console.log('TODO');
    //Voir les modifs de Pierre, peut etre regle en deux temps, trois mouvements
}

function prettifyString(ugly_string){
    var pretty_string = ugly_string.charAt(0).toUpperCase() + ugly_string.slice(1);
    pretty_string.replace(/_/g, ' ');
    return pretty_string
}
