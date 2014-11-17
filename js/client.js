// Ensure housing namespace is available
var housing = housing || {};

housing.client = housing.client || {};

housing.client.serverError = "A server error has occurred. Please contact the developers of this website and report an error with ";
housing.client.unauthorizedError = "You are not authorized to register for housing. Please check that you are logged in with an RIT Google account";

housing.client.load = function(svg,nav,floor) {
    // Load the floor. 
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.rooms) {
        // If the Google APIs are available, then get the list of
        // available rooms through them.
        gapi.client.housing.housing.rooms().then(
                function(resp) {
                    var floors = resp.result.floors;
                    if(floor == undefined) {
                        floor = floors[0].number;
                    }
                    housing.init(svg,nav,floors,true);
                    housing.load(floors,floor,svg);
                },
                function(resp) {
                    var code = resp.result.error.code;
                    var msg = resp.result.error.message;
                    if(code < 500){
                        if(code == 401){
                            housing.client.displayError(housing.client.unauthorizedError,resp.result.error);
                            window.setTimeout(housing.app,0,false);
                        } else {
                            housing.client.displayError(msg,resp.result.error);
                        }
                    } else {
                        housing.client.displayError(housing.client.serverError+"'rooms()'");
                    }
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
                fcnFailure({"result":{"error":{ "code":600, "message": "API Not Available"}}});
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
                fcnFailure({"result":{"error":{ "code":600, "message": "API Not Available"}}});
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
                fcnFailure({"result":{"error":{ "code":600, "message": "API Not Available"}}});
            }
        };
    }
};

housing.client.displayError = function (msg,log) {
    if(msg){
        // hide loading icon, if applicable
        $("#loading").hide();
        // update error message
        $("#errorModal .message").html(msg);
        // show error dialog
        $("#errorModal").foundation('reveal', 'open');
    }
    if(log && window.console && console.log){
        console.log(log);
    }
}

housing.client.errorHelper = function (error,source) {
    var msg = "";
    if( error.code == 401 ) {
        msg = housing.client.unauthorizedError;
        if(error.message.contains('@')){
            msg += "<br><br>"+error.message;
        }
        window.setTimeout(housing.app,0,false);
    } else {
        if( error.code >= 500 ) {
            msg = housing.client.serverError;
            if(source){
                msg += "'"+source+"'";
            } else {
                msg += "'generic'";
            }
        } else {
            if(window.console && console.warn){
                console.warn("housing.client.unauthorized called with unrecognized error!");
            }
            msg = error.message;
        }
    }
    housing.client.displayError(msg,error);
}
