var viewerApp;
var model;

function post(path, method) {

    var form = document.createElement("form");
    form.setAttribute("action", path);
    form.setAttribute("method", method);
    document.body.appendChild(form);
    form.submit();
}

function showModel(urn) {
    console.log("URN: " + urn);
    
    if (urn === '') {
        post("Home/Upload", "post");
    }
    else {
        var options = {
            env: 'AutodeskProduction',
            getAccessToken: getAccessToken,
            refreshToken: getAccessToken
        };

        var documentId = 'urn:' + urn;

       // console.log("BEAREAR: " + getAccessToken());

        window.Autodesk.Viewing.Initializer(options, function onInitialized() {

            viewerApp = new window.Autodesk.Viewing.ViewingApplication('MyViewerDiv');
            //Configure the extension
            var config3D = {
                extensions: ["AttributeExtension", "markup3d"]
            };
            
            viewerApp.registerViewer(viewerApp.k3D, window.Autodesk.Viewing.Private.GuiViewer3D, config3D);
            viewerApp.loadDocument(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);    

            var viewer = this.viewer;
            console.log(viewer);

            initializeMarkup();
        });

        function getAccessToken() {
            var xmlHttp = null;
            xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", '/api/forge/token', false /*forge viewer requires SYNC*/);
            xmlHttp.send(null);
            return xmlHttp.responseText;
        }        
    }   
}

function onDocumentLoadSuccess(doc) {

    var viewables = viewerApp.bubble.search({ 'type': 'geometry' });
    if (viewables.length === 0) {
        console.error('Document contains no viewables.');
        return;
    }

    document = doc;
    viewerApp.selectItem(viewables[0].data, onItemLoadSuccess, onItemLoadFail);
}

function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

function onItemLoadSuccess(viewer, item) {
    model = viewer.model;
}

function onItemLoadFail(errorCode) {
    console.error('onItemLoadFail() - errorCode:' + errorCode);
}

function initializeMarkup() {
    var elem = $("label");
    // create 20 random markup points
    // where icon is 0="Issue", 1="BIMIQ_Warning", 2="RFI", 3="BIMIQ_Hazard"
    var dummyData = [];
    for (let i = 0; i < 20; i++) {
        dummyData.push({
            icon: Math.round(Math.random() * 3),
            x: Math.random() * 30000 - 15000,
            y: Math.random() * 5000 - 2000,
            z: Math.random() * 15000 - 13000
        });
    }
    window.dispatchEvent(new CustomEvent('newData', { 'detail': dummyData }));

    function moveLabel(p) {
        elem.style.left = ((p.x + 1) / 2 * window.innerWidth) + 'px';
        elem.style.top = (-(p.y - 1) / 2 * window.innerHeight) + 'px';
    }
    // listen for the 'Markup' event, to re-position our <DIV> POPUP box
    window.addEventListener("onMarkupMove", e => { moveLabel(e.detail) }, false)
    window.addEventListener("onMarkupClick", e => {
        elem.style.display = "block";
        moveLabel(e.detail);
        elem.innerHTML = `<img src="img/${(e.detail.id % 6)}.jpg"><br>Markup ID:${e.detail.id}`;
    }, false);
}

Autodesk.ADN.Viewing.Extension.CustomTool();

