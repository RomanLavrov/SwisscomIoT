﻿var panelDetectors;
var panelDashboard;
var panelAttributes;
var panelChart;
var panel;
var tree;
var detectors = [];
var viewer;

function AttributeExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
    panelDetectors = null;
    panelDashboard = null;
    panelAttributes = null;
    panelChart = null;
}
AttributeExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
AttributeExtension.prototype.constructor = AttributeExtension;

AttributeExtension.prototype.load = function () {
    console.log('AttributeExtension is loaded');
    viewer = this.viewer;

    this.onSelectionBinded = this.onSelectionEvent.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionBinded);
    this.onSelectionBinded = null;
    var ext = this;

    Toolbar(viewer);

    viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function () {

        console.log('Tree loaded');
        tree = viewer.model.getData().instanceTree;

        var rootId = this.rootId = tree.getRootId();

        var rootName = tree.getNodeName(rootId);
        var childCount = 0;
        var list;

        tree.enumNodeChildren(rootId, function (childId) {
            var childName = tree.getNodeName(childId);
            detectors.push(childName);
            list += String(childName) + '\n';
        });
        //console.log('Root Elements' + list + 'Length ' + detectors.length);

        detectors = getAlldbIds(rootId, tree);
    });
    return true;
};

AttributeExtension.prototype.onSelectionEvent = function (event) {
    var currentSelection = this.viewer.getSelection();
    var elementID = document.getElementById("elementID");
    this.viewer.fitToView(currentSelection); // Scale screen to selected object!!!!
    //elementID.innerHTML = currentSelection;
    var SelectedId = parseInt(currentSelection);

    httpGet(SelectedId);
};

function getAccessToken() {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", '/api/forge/token', false /*forge viewer requires SYNC*/);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

//---Get properties from URN
function httpGet(selectedId) {
    var xmlHttpViewID = new XMLHttpRequest();
    xmlHttpViewID.open("GET", "https://developer.api.autodesk.com/modelderivative/v2/designdata/" + urn + "/metadata", false);
    xmlHttpViewID.setRequestHeader("Authorization", "Bearer " + getAccessToken());
    xmlHttpViewID.send();
    //console.log("Request sent");
    //console.log("ViewID: " + xmlHttpViewID.status + " " + xmlHttpViewID.responseText);
    console.log(xmlHttpViewID.responseText);
    var objViewId = JSON.parse(xmlHttpViewID.responseText);
    var GUID = objViewId.data.metadata[0].guid;
    console.log(objViewId.data.metadata[0].guid);

    var xmlHttpProperties;
    if (GUID !== null) {
        xmlHttpProperties = new XMLHttpRequest();
        xmlHttpProperties.open("GET", "https://developer.api.autodesk.com/modelderivative/v2/designdata/" + urn + "/metadata/" + GUID + "/properties?objectid=" + selectedId, false);
        xmlHttpProperties.setRequestHeader("Authorization", "Bearer " + getAccessToken());
        xmlHttpProperties.send();
    }

    var objProperties = JSON.parse(xmlHttpProperties.responseText);
    console.log("Properties: " + xmlHttpProperties.status + " " + xmlHttpProperties.statusText + xmlHttpProperties.responseText);

    var propObjectId = document.getElementById("propObjectId");
    propObjectId.innerHTML = objProperties.data.collection[0].objectid;
    var propName = document.getElementById("propName");
    propName.innerHTML = objProperties.data.collection[0].name;
    //var propHidden = document.getElementById("propHidden");
    //propHidden.innerHTML = objProperties.data.collection[0].properties.Item.Hidden;
    //var propLayer = document.getElementById("propLayer");
    //propLayer.innerHTML = objProperties.data.collection[0].properties.Item.Layer;
    //var propMaterial = document.getElementById("propMaterial");
    //propMaterial.innerHTML = objProperties.data.collection[0].properties.Item.Material;
    //var propType = document.getElementById("propType");
    //propType.innerHTML = objProperties.data.collection[0].properties.Item.Type;

    // console.log(   objProperties.data.collection[0].objectid + " | "
    //              + objProperties.data.collection[0].name + " | "
    //              + objProperties.data.collection[0].properties.Item.Hidden + " | ");
    return xmlHttpProperties.status;
}

Autodesk.Viewing.theExtensionManager.registerExtension('AttributeExtension', AttributeExtension);

//-----Simple Panel
SimplePanel = function (parentContainer, id, title, content, x, y) {
    this.content = content;
    Autodesk.Viewing.UI.DockingPanel.call(this, parentContainer, id, '');

    // Auto-fit to the content and don't allow resize.  Position at the coordinates given.
    this.container.classList.add('docking-panel-container-solid-color-a');
    this.container.style.top = "10px";
    this.container.style.left = "10px";
    this.container.style.width = "auto";
    this.container.style.height = "auto";
    this.container.style.resize = "both";
    this.container.style.left = x + "px";
    this.container.style.top = y + "px";
};

SimplePanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
SimplePanel.prototype.constructor = SimplePanel;

SimplePanel.prototype.initialize = function () {

    console.log("Docking panel loaded");

    this.title = this.createTitleBar(this.titleLabel || this.container.id);
    this.container.appendChild(this.title);

    this.container.appendChild(this.content);
    this.initializeMoveHandlers(this.container);

    this.closer = this.createCloseButton();
    this.title.appendChild(this.closer);
    this.initializeCloseHandler(this.closer);

    var scrollContainer = { left: false, heightAdjustment: 45, marginTop: 0 };
    this.scrollcontainer = this.createScrollContainer(scrollContainer);

    var html = [
        '<div class="uicomponent-panel-controls-container">',
        '<div class="panel panel-default">',
        '<table bgcolor="#00FF00" class="table table-bordered table-inverse" id = "clashresultstable">',
        '<thead bgcolor="#323232">',
        '<th>Atrtribute name</th><th>Value in project</th><th>New Value</th>',
        '</thead>',
        '<tbody bgcolor="#323232">'].join('\n');

    //for (var i = 0; i < 10; i++) {
    //    html += ['<tr><td>' + "Attribute" + '</td><td><div id="elementID">Ok</div></td><td><input type="text" name="fname"></td><td><button style="color: black">Save</button></td></tr>'].join('\n');
    //}

    html += ['<tr><td>' + "Object ID" + '</td><td><div id="propObjectId">-</div></td><td><input type="text" name="fname"></td></tr>'].join('\n');
    html += ['<tr><td>' + "Name" + '</td><td><div id="propName">-</div></td><td><input type="text" name="fname"></td></tr>'].join('\n');
    html += ['<tr><td>' + "Hidden" + '</td><td><div id="propHidden">-</div></td><td><input type="text" name="fname"></td></tr>'].join('\n');
    html += ['<tr><td>' + "Layer" + '</td><td><div id="propLayer">-</div></td><td><input type="text" name="fname"></td></tr>'].join('\n');
    html += ['<tr><td>' + "Material" + '</td><td><div id="propMaterial">-</div></td><td><input type="text" name="fname"></td></tr>'].join('\n');
    html += ['<tr><td>' + "Type" + '</td><td><div id="propType">-</div></td><td><input type="text" name="fname"></td></tr>'].join('\n');
    html += ['<tr><td></td><td></td><td style="text-align: center"><button style="color: black; width: 146px"> Save </button></td></tr>'];

    html += ['</tbody>',
        '</table>',
        '</div>',
        '</div>'
    ].join('\n');

    $(this.scrollcontainer).append(html);
};

function Toolbar(viewer) {
    var toolbarDivHtml = '<div id="divToolbar"> </div>';

    $(viewer.container).append(toolbarDivHtml);

    var toolbar = new Autodesk.Viewing.UI.ToolBar(true);

    var ctrlGroup = new Autodesk.Viewing.UI.ControlGroup("Autodesk.ADN.Viewing.Extension.Toolbar.ControlGroup2");

    var buttonDetectors = new Autodesk.Viewing.UI.Button('toolbar-button-Detector');
    buttonDetectors.addClass('toolbar-button-Detector');
    buttonDetectors.setToolTip('Show Detectors');
    buttonDetectors.onClick = function (e) {
        ShowDetectors(viewer, viewer.container);
    };

    var buttonMarks = new Autodesk.Viewing.UI.Button('toolbar-button-Mark');
    buttonMarks.addClass('toolbar-button-Mark');
    buttonMarks.setToolTip('Show Marks');
    buttonMarks.onClick = function (e) {
        ShowLabels();
    };

    var buttonMeter = new Autodesk.Viewing.UI.Button('toolbar-button-Meter');
    buttonMeter.addClass('toolbar-button-Meter');
    buttonMeter.setToolTip('Show Dashboard');
    buttonMeter.onClick = function (e) {
        ShowDashboard(viewer, viewer.container);
    };

    var buttonChart = new Autodesk.Viewing.UI.Button('toolbar-button-Chart');
    buttonChart.addClass('toolbar-button-Chart');
    buttonChart.setToolTip('Show Chart');
    buttonChart.onClick = function (e) {
        ShowChart(viewer, viewer.container);
    };

    var buttonAttributes = new Autodesk.Viewing.UI.Button('toolbar-button-Attributes');
    buttonAttributes.addClass('toolbar-button-Attributes');
    buttonAttributes.setToolTip('Show Attributes');
    buttonAttributes.onClick = function (e) {
        ShowAttributes(viewer, viewer.containe);
    };

    ctrlGroup.addControl(buttonDetectors);
    ctrlGroup.addControl(buttonMarks);
    ctrlGroup.addControl(buttonMeter);
    ctrlGroup.addControl(buttonChart);
    ctrlGroup.addControl(buttonAttributes);

    toolbar.addControl(ctrlGroup);
    console.log("Toolbar added");
    $('#divToolbar')[0].appendChild(toolbar.container);
}

function ShowDetectors(viewer, container, id, title, options) {
    console.log("DETECTORS INIT");

    if (panelDetectors === null) {
        panelDetectors = new DetectorsPanel(viewer, viewer.container,
            'awesomeExtensionPanel', 'Detectors');
    }
    // show/hide docking panel
    panelDetectors.setVisible(!panelDetectors.isVisible());
}

function ShowLabels() {

    console.log("LABELS INIT");
}

function ShowDashboard(viewer, container, id, title, options) {
    console.log("Dashboard init");

    if (panelDashboard === null) {
        panelDashboard = new DashboardPanel(viewer, viewer.container,
            'awesomeExtensionPanel2', 'Dashboard');
    }
    // show/hide docking panel
    panelDashboard.setVisible(!panelDashboard.isVisible());
}

function ShowChart(viewer, container, id, title, options) {
    console.log("Chart init");

    if (panelChart === null) {
        panelChart = new ChartPanel(viewer, viewer.container,
            'awesomeExtensionPanel3', 'Chart');
    }
    // show/hide docking panel
    panelChart.setVisible(!panelChart.isVisible());
}

function ShowAttributes(viewer, container, id, title, option) {
    var content = document.createElement('div');
    if (panelAttributes === null) {
        panelAttributes = new SimplePanel(viewer.container, "Attributes", "Attributes List", content, 20, 20);
    }
    panelAttributes.setVisible(!panelAttributes.isVisible());
}

function DetectorsPanel(viewer, container, id, title, options) {
    this.viewer = viewer;
    Autodesk.Viewing.UI.DockingPanel.call(this, container, id, title, options);

    // the style of the docking panel
    // use this built-in style to support Themes on Viewer 4+
    this.container.classList.add('docking-panel-container-solid-color-a');
    this.container.style.top = "30%";
    this.container.style.left = "60%";
    this.container.style.width = "auto";
    this.container.style.height = "auto";
    this.container.style.resize = "both";

    // this is where we should place the content of our panel
    var div = document.createElement('div');
    div.style.margin = '20px';

    var html = [
        '<div class="uicomponent-panel-controls-container">',
        '<div class="panel panel-default">',
        '<table bgcolor="#00FF00" class="table table-bordered table-inverse" id = "clashresultstable">',
        '<thead bgcolor="#323232">',
        '<th>Detector name</th>',
        '</thead>',
        '<tbody bgcolor="#323232">'].join('\n');

    for (var i = 0; i < detectors.length; i++) {
        html += ['<tr><td><button class="btn btn-primary" style="color: white" onclick="showElement(' + i + ');">' + detectors[i] + '</button></td></tr>'].join('\n');
    }

    html += ['</tbody>',
        '</table>',
        '</div>',
        '</div>'
    ].join('\n');

    // and may also append child elements...
    div.innerHTML = html;
    this.container.appendChild(div);
}
DetectorsPanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
DetectorsPanel.prototype.constructor = DetectorsPanel;

function DashboardPanel(viewer, container, id, title, options) {
    this.viewer = viewer;
    Autodesk.Viewing.UI.DockingPanel.call(this, container, id, title, options);
    this.container.classList.add('docking-panel-container-solid-color-a');
    this.container.style.top = "30%";
    this.container.style.left = "80px";
    this.container.style.width = "500px";
    this.container.style.height = "auto";
    this.container.style.resize = "both";
    // this is where we should place the content of our panel
    var div = document.createElement('div');
    div.style.margin = '20px';


    var html = ["<div>" + detectors[0] + "</div>"].join('\n');
    html += ["<div id=\"dashboard_div\" style=\"width: 130px; height: 120px;display: inline-block;\"></div>"].join('\n');
    html += ["<div>" + detectors[1] + "</div>"].join('\n');
    html += ["<div id=\"dashboard_div1\" style=\"width: 130px; height: 120px; display: inline-block;\"></div>"].join('\n');
    //-------------------------------------
    google.charts.load('current', {
        'packages': ['gauge']
    });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable([
            ['Label', 'Value'],
            ['Temp, °C', 22]
        ]);

        var options = {
            min: 20,
            max: 30,
            width: 120,
            height: 120,
            redFrom: 28,
            redTo: 30,
            yellowFrom: 25,
            yellowTo: 28,
            greenFrom: 20,
            greenTo: 25,
            minorTicks: 5
        };

        var chart = new google.visualization.Gauge(document.getElementById('dashboard_div'));
        var chart2 = new google.visualization.Gauge(document.getElementById('dashboard_div1'));

        chart.draw(data, options);
        chart2.draw(data, options);

        setInterval(function () {
            data.setValue(0, 1, Math.round(21 + 4 * Math.random()));
            chart.draw(data, options);
        }, 1000);

        setInterval(function () {
            data.setValue(0, 1, Math.round(21 + 4 * Math.random()));
            chart2.draw(data, options);
        }, 1200);
    }

    //--------------------------------------
    div.innerHTML = html;
    this.container.appendChild(div);
}

DashboardPanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
DashboardPanel.prototype.constructor = DashboardPanel;


function ChartPanel(viewer, container, id, title, options) {
    this.viewer = viewer;
    Autodesk.Viewing.UI.DockingPanel.call(this, container, id, title, options);

    // the style of the docking panel
    // use this built-in style to support Themes on Viewer 4+
    this.container.classList.add('docking-panel-container-solid-color-a');
    this.container.style.top = "30%";
    this.container.style.left = "80px";
    this.container.style.width = "500px";
    this.container.style.height = "auto";
    this.container.style.resize = "both";

    // this is where we should place the content of our panel
    var div = document.createElement('div');
    div.style.margin = '20px';

    var html = ["<div>" + detectors[0] + "</div>"].join('\n');
    html += [" <div id=\"chart_div\"></div>"].join('\n');
    html += ["<div>" + detectors[1] + "</div>"].join('\n');
    html += [" <div id=\"chart_div2\"></div>"].join('\n');


    //-------------------------------------
    google.charts.load('current', { packages: ['corechart', 'line'] });
    google.charts.setOnLoadCallback(drawBackgroundColor);

    function drawBackgroundColor() {
        var data = new google.visualization.DataTable();
        data.addColumn('number', 'Day');
        data.addColumn('number', 'Temperature');

        for (var i = 0; i < 15; i++) {
            var simulatedTemp = Math.random();
            data.addRow([i, simulatedTemp * 5 + 20]);
        }

        var options = {
            hAxis: {
                title: 'Time'
            },
            vAxis: {
                title: 'Temperature'
            },
            backgroundColor: '#f0f0f0'
        };

        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);


        var data2 = new google.visualization.DataTable();
        data2.addColumn('number', 'Day');
        data2.addColumn('number', 'Temperature');

        for (var i = 0; i < 15; i++) {
            var simulatedTemp = Math.random();
            data2.addRow([i, simulatedTemp * 5 + 20]);
        }

        var options = {
            hAxis: {
                title: 'Time'
            },
            vAxis: {
                title: 'Temperature'
            },
            backgroundColor: '#f0f0f0'
        };
        var chart2 = new google.visualization.LineChart(document.getElementById('chart_div2'));
        chart2.draw(data2, options);
    }
    div.innerHTML = html;
    this.container.appendChild(div);
}
ChartPanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
ChartPanel.prototype.constructor = ChartPanel;


function showElement(value) {

    var detectorName = detectors[value];
    var index = detectorName.indexOf("[");

    var detectorId = detectorName.substring(index + 1, detectorName.length - 1);

    viewer.search(detectorId, SearchResult);

    function SearchResult(idArray) {
        viewer.fitToView(idArray);
    }
}

//-----Get elements from viewer

function getAlldbIds(rootId, tree) {
    var allDBId = [];
    var elementsNames = [];

    if (!rootId) {
        return allDBId;
    }

    var queue = [];
    queue.push(rootId);
    while (queue.length > 0) {
        var node = queue.shift();
        allDBId.push(node);
        tree.enumNodeChildren(node, function (childrenIds) {
            queue.push(childrenIds);
        });
    }

    for (var i = 0; i < allDBId.length; i++) {
        if (tree.getNodeName(allDBId[i]).includes('RAUCH') && tree.getNodeName(allDBId[i]).includes('[')) {
            elementsNames.push(tree.getNodeName(allDBId[i]));
        }
    }
    return elementsNames;
}


