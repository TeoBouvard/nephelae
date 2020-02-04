// Displayed length of maximum duration mission
var baseSize = 10000.0
// This is the size of an infinite duration on the feedback chart relative to
// the maximum mission duration across all aircrafts (only used for display).
var infSize = 1.5*baseSize;
// Mission chart display data.
var chartData = {};

const chartMissionSocket = new Refresher(refreshTypes.MISSION_VALIDATION,
    setChart);

function updateChartData() {
    // Updates chartData with current mission status of the aircrafts.
    
    chartData = {};
    chartData.rawData = {};
    chartData.displayData = {};
    // Default max duration is inf=-1.0. Will be replaced by positive duration
    // if any. Is solely used to define time scale for display.
    chartData.maxDuration = -1
    $.getJSON('/aircrafts/current_mission_status_all/', (response) => {
        for (aircraftId in response) {
            chartData.rawData[aircraftId] = {
                current_mission_time_left : response[aircraftId].current_mission_time_left,
                mission_data : response[aircraftId].missions
            };
            for (mission of chartData.rawData[aircraftId].mission_data) {
                if (mission.duration > 0 && mission.duration > chartData.maxDuration)
                    chartData.maxDuration = mission.duration;
            }
        }
        console.log(chartData.rawData);
        setupChart();
    });
}

function updateChartDisplayData() {
    // chartData.displayData contains raw display data to be displayed in the
    // chart. No request to the server in here. This is made to simplify the
    // function setupChart.
    // The main goal is to cleanly manage current_mission_time_left for all
    // aircraft.  For the display, current_mission_time_left = origin of time.
    // Mission blocks are then placed accordingly.
    
    chartData.displayData = {};

    var rawData     = chartData.rawData;
    var displayData = chartData.displayData;

    if (chartData.maxDuration < 0) 
        displayData.timeScale = baseSize;
    else
        displayData.timeScale = baseSize / chartData.maxDuration;
    // displayData.infSize is the displayed length of the missions with infinite
    // time. (> to the max mission time, but obviously cannot be infinite);
    displayData.data = {};

    var t0, firstSize, timeLeft;
    for (key in rawData) {
        var mission_data = rawData[key].mission_data;

        // Check if some mission were defined for this aircraft.
        if (mission_data.length < 1)
            continue;
        
        // In this section the goal is to find the time t0 when the first
        // mission in this list was launched. Then to get the dates of all the
        // missions we just have to iterate on the mission while adding their
        // durations. Current time is always set to 0 for the display.
        // (t0 = 0 = present time)
        timeLeft  = rawData[key].current_mission_time_left;
        if (mission_data[0].duration < 0) {
            // Here duration is inf, so timeLeft should be inf also. We
            // arbitrarily set the time origin (present time) in the middle of
            // the mission.
            t0 = -infSize / 2
        }
        else {
            // Should not be possible // (make a catch block to ignore ?)
            if (timeLeft < 0) 
                throw "Error : Got finite mission time with infinite time remaining."
            t0 = timeLeft - mission_data[0].duration;
        }

        // Now we iterate on the missions to build the list of displayed
        // mission elements
        displayData.data[key] = [];
        for (mission of mission_data) {
            if (mission.duration < 0)
                size = infSize;
            else
                size = mission.duration * displayData.timeScale;

            displayData.data[key].push(
                [String(mission.aircraftId),
                 String(mission.missionId) + ' : ' + mission.type,
                 t0, t0 + size]);
            t0 = t0 + size;
        }
    }
}

function setupChart(){
    // Making sure display data is up to date.
    updateChartDisplayData();    

    chart = new google.visualization.Timeline($('#chart_div')[0]);
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'UAV' });
    dataTable.addColumn({ type: 'string', id: 'Label' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var rowData = [];
    rowData.push([ '\5', 'Now', 0, 0]);
    for (key in chartData.displayData.data) {
        for (el of chartData.displayData.data[key])
            rowData.push(el);
    }
    //console.log(rowData);
    dataTable.addRows(rowData);

    ////fake data
    //rowData = [[ '\5', 'Now', 0, 0],
    //           ['100', 'Idle', -5000, 10000],
    //           ['100', 'Takeoff', 10000, 15000],
    //           ['100', 'Survey', 15000, 40000],
    //           ['101', 'Idle', -5000, 5000],
    //           ['101', 'Takeoff', 5000, 10000],
    //           ['101', 'Goto S1', 10000, 20000],
    //           ['101', 'Idle', 20000, 40000],
    //           ['102', 'Idle', -5000, 5000],
    //           ['102', 'Takeoff', 5000, 10000],
    //           ['102', 'Survey', 10000, 40000],
    //           ['103', 'Idle', -5000, 40000],
    //           ['104', 'Idle', -5000, 40000],
    //           ['105', 'Idle', -5000, 40000]];
    //console.log(rowData);
    //dataTable.addRows(rowData);

    var options = {
            colors: ['green','blue','red'],
            timeline: {
                rowLabelStyle: {
                    fontName: 'Roboto', fontSize: 14
                },
                barLabelStyle: { 
                    fontName: 'Roboto', fontSize: 12
                }
            },
            tooltip: {
                trigger: 'none',
            },
            height: 400,
    };

    // draw the chart
    chart.draw(dataTable, options);
   
    // draw a reference line over the chart 
    referenceLine('chart_div');
    google.visualization.events.addListener(chart, 'onmouseout', () => referenceLine('chart_div') );

    // make chart responsive
    $(window).resize(() => {setupChart()});
}

// draw a vertical line at current time in the chart
function referenceLine(div){
    var height;
    $('#' + div + ' rect').each(function(index){
        var x = parseFloat($(this).attr('x'));
        var y = parseFloat($(this).attr('y'));
        if(x == 0 && y == 0) height = parseFloat($(this).attr('height'));
    });

    var nowWord = $('#' + div + ' text:contains("Now")');
    nowWord.prev().first().attr('height', height + 'px').attr('width', '1px').attr('y', '0');
}

function setChart(response){
    var query = $.param({mission_id: response.mission_id,
        aircraft_id: response.aircraft_id});
    $.ajax({
        dataType: 'JSON',
        url: 'get_state_mission/?' + query,
        success: function(mission){
            if (mission.authorized){
                switch(mission.insertMode){
                    case 0:
                        chartData.rawData[response.aircraft_id]
                            .mission_data.push(mission);
                        break;
                    case 1:
                        chartData.rawData[response.aircraft_id]
                            .mission_data.unshift(mission);
                        break;
                    case 2:
                        chartData.rawData[response.aircraft_id]
                            .mission_data.shift();
                        chartData.rawData[response.aircraft_id]
                            .mission_data.unshift(mission);
                        break;
                    case 3:
                        chartData.rawData[response.aircraft_id] = [mission];
                        break;
                    default:
                        throw 'Something went wrong, insertMode is not known';
                }
                setupChart();
            }
        },
    });
}
