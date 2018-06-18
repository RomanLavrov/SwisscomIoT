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
                extensions: ["AttributeExtension", "markup3d", "Autodesk.ADN.Viewing.Extension.CustomTool"]
            };
            
            viewerApp.registerViewer(viewerApp.k3D, window.Autodesk.Viewing.Private.GuiViewer3D, config3D);
            viewerApp.loadDocument(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);           
            
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



