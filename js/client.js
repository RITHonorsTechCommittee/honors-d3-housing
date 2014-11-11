// Ensure housing namespace is available
var housing = housing || {};

housing.client = housing.client || {};

housing.client.load = function(svg,nav,floor) {
    // Load the floor. 
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.rooms) {
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
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.current) {
        return gapi.client.housing.housing.current();
    } else {
        return {
            then: function(fcnSuccess,fcnFailure){
                fcnFailure({"result":{"error": "API Not Available"}});
            }
        };
    }
};

housing.client.reserve = function(num) {
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.reserve) {
        return gapi.client.housing.housing.reserve({"number":num});
    } else {
        return {
            then: function(fcnSuccess,fcnFailure){
                fcnFailure({"result":{"error": "API Not Available"}});
            }
        };
    }
};

housing.client.deleteReservation = function() {
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.deleteReservation) {
        return gapi.client.housing.housing.deleteReservation();
    } else {
        return {
            then: function(fcnSuccess,fcnFailure){
                fcnFailure({"result":{"error": "API Not Available"}});
            }
        };
    }
};
