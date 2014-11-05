// Ensure housing namespace is available
var housing = housing || {};

housing.client = housing.client || {};

housing.client.load = function(svg,nav,floor) {
    // Load the floor. 
    if(window.gapi && gapi.client && gapi.client.housing) {
        // If the Google APIs are available, then get the list of
        // available rooms through them.
        gapi.client.housing.housing.rooms().then(
                function(resp) {
                    var floors = resp.result.floors;
                    housing.init(svg,nav,floors);
                    housing.load(floors,floor,svg);
                },
                function(err) {
                    console.log(err);
                    //TODO: identify error and handle appropriately
                });
    } else {
        // display example rooms if api not available
        d3.json("/spec.json",function(err,jsonobj){
            if(jsonobj){
                housing.init(svg,nav,jsonobj.floors,false);
                housing.load(jsonobj.floors,floor,svg);
            }
        });
    }
};

housing.client.current = function() {
    //TODO: use gapi.client.housing.housing.current if available
    return {
        then: function(fcnSuccess,fcnFailure){
            fcnFailure({"result":{"error": "Not Implemented"}});
        }
    };
};
