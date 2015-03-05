/**
 * endpoints.js -- namespace housing.endpoints
 *
 * The functions in this file are responsible for loading the Google APIs,
 * authorizing users, providing error handling, and wrapping housing Endpoints
 * methods
 */
var housing = housing || {};
housing.endpoints = housing.endpoints || {};

// Constants
housing.endpoints.hostname = 'https://rithonorshousing.appspot.com';
housing.endpoints.clientId = '180343920180-41f9qsqdcf9it1poolqtqages644lgs3.apps.googleusercontent.com';
housing.endpoints.scopes = 'https://www.googleapis.com/auth/userinfo.email';
housing.endpoints.serverError = "A server error has occurred. Please contact the developers of this website and report an error with ";
housing.endpoints.unauthorizedError = "You are not authorized to register for housing. Please check that you are logged in with an RIT Google account";

/**
 * Loads Google APIs, attempts to log in the user and calls the provided
 * callback function with the results of the authentication attempt.
 */

/**
 * Loads Google APIs and calls housing.endpoints.check when done
 */
housing.endpoints.login = function( callback ) {
    var apisToLoad;
    var loadCallback = function() {
        if(--apisToLoad == 0) {
            housing.endpoints.check( callback );
        }
    };

    apisToLoad = 2;
    gapi.client.load('housing', 'v1', loadCallback, housing.endpoints.hostname+"/_ah/api");
    gapi.client.load('oauth2', 'v2', loadCallback);
};

/**
 * Checks if the user is logged in already. Will give precedence to RIT accounts
 * 
 * Passes credentials to housing.endpoints.result
 */
housing.endpoints.check = function( callback ) {
    housing.endpoints.app = callback;
    gapi.auth.authorize({
        client_id: housing.endpoints.clientId,
        scope: housing.endpoints.scopes,
        immediate: true,
        hd: "g.rit.edu",
    }, housing.endpoints.result );
};

/**
 * Event handler that executes when the user clicks the sign in/sign out button
 */
housing.endpoints.click = function() {
    gapi.auth.authorize({
        client_id: housing.endpoints.clientId,
        scope: housing.endpoints.scopes,
        immediate: false,
        authuser: "",
    }, housing.endpoints.result);
    return false;
}

/**
 * Starts the app. If the user is logged in, it puts their email in the title bar.
 */
housing.endpoints.result = function( result ) {
    // Get the user's email
    gapi.client.oauth2.userinfo.get().then(function(resp){
        // Put the email in the top bar so users can see which account they are logged in under
        d3.select(".username").html(null)
            .append("a")
            .on("click", housing.endpoints.click)
            .attr("title","Click to change accounts")
            .text(resp.result.email);
    },function(resp){
        if(window.console && console.log){
            console.log(resp.result.error);
        }
    });

    housing.endpoints.app((result && !result.error));
}

/**
 * Wraps gapi.client.housing.housing.rooms
 *
 * Returns a thenable that will call the success callback with a floors object
 * and floor number. The floor number passed to this function will be used unless
 * a floor of that number does not exist.
 *
 * The failure callback to the thenable can be omitted to use the built in
 * error handling, but if a failure callback is supplied, the built in error
 * messages will not be triggered.
 *
 * If the API is unavailable, a sample list of rooms from spec.json is returned
 *
 * @param floor The floor to load. This will be passed to the success callback
 * @return thenable thenable.then(fcnSuccess,fcnFailure)
 */
housing.endpoints.load = function(floor) {
    return { then: function(fcnSuccess,fcnFailure){
        // Load the floor. 
        if(window.gapi && gapi.client.housing && gapi.client.housing.housing.rooms) {
        // If the Google APIs are available, then get the list of
        // available rooms through them.
            gapi.client.housing.housing.rooms().then(
                function(resp) {
                    if(floor == undefined) {
                        floor = jsonobj.floors[0].number;
                    }
                    fcnSuccess(resp.result.floors, floor);
                },
                function(resp) {
                    if( fcnFailure ) {
                        fcnFailure(resp);
                    } else {
                        var code = resp.result.error.code;
                        var msg = resp.result.error.message;
                        if(code < 500){
                            if(code == 401){
                                housing.endpoints.displayError(housing.endpoints.unauthorizedError,resp.result.error);
                                window.setTimeout(housing.app,0,false);
                            } else {
                                housing.endpoints.displayError(msg,resp.result.error);
                            }
                        } else {
                            housing.endpoints.displayError(housing.endpoints.serverError+"'rooms()'");
                        }
                    }
                });
        } else {
            // display example rooms if api not available
            d3.json("/spec.json",function(err,jsonobj){
                if(jsonobj){
                    if(floor == undefined) {
                        floor = jsonobj.floors[0].number;
                    }
                    fcnSuccess(jsonobj.floors,floor);
                } else {
                    fcnFailure({"result":{"error":{ "code":600, "message": err}}});
                }
            });
        }
    } // end of then function
    } // end of thenable object
};

/**
 * Wraps gapi.client.housing.current
 *
 * If the API is available, the thenable returned is simply the thenable that
 * would have been obtained from gapi.client.housing.housing.current. If the
 * API is not available, a thenable which always calls the failure callback with
 * error code 600 is returned.  The error is wrapped in an object with the same
 * structure as normal GAPI errors
 */
housing.endpoints.current = function() {
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

/**
 * Wraps gapi.client.housing.reserve
 *
 * If the API is available, the thenable returned is simply the thenable that
 * would have been obtained from gapi.client.housing.housing.current. If the
 * API is not available, a thenable which always calls the failure callback with
 * error code 600 is returned.  The error is wrapped in an object with the same
 * structure as normal GAPI errors
 */
housing.endpoints.reserve = function(num) {
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

/**
 * Wraps gapi.client.housing.deleteReservation
 *
 * If the API is available, the thenable returned is simply the thenable that
 * would have been obtained from gapi.client.housing.housing.current. If the
 * API is not available, a thenable which always calls the failure callback with
 * error code 600 is returned.  The error is wrapped in an object with the same
 * structure as normal GAPI errors
 */
housing.endpoints.deleteReservation = function() {
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

/**
 * Reveals an error modal with the specified message.
 *
 * If log is truthy and console.log is supported, the parameter log will also
 * be logged to the console.
 *
 * @param msg the error message to display
 * @param log an object to log to console
 */
housing.endpoints.displayError = function (msg,log) {
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

/**
 * Provides error messages to common errors and calls displayError.
 *
 * See the constants in endpoints.js for the error message text.
 *
 * @param error an error object
 * @param source a human readable description of where the error occurred.
 */
housing.endpoints.errorHelper = function (error,source) {
    var msg = "";
    if( error.code == 401 ) {
        msg = housing.endpoints.unauthorizedError;
        if(error.message.contains('@')){
            msg += "<br><br>"+error.message;
        }
        window.setTimeout(housing.app,0,false);
    } else {
        if( error.code >= 500 ) {
            msg = housing.endpoints.serverError;
            if(source){
                msg += "'"+source+"'";
            } else {
                msg += "'generic'";
            }
        } else {
            if(window.console && console.warn){
                console.warn("housing.endpoints.unauthorized called with unrecognized error!");
            }
            msg = error.message;
        }
    }
    housing.endpoints.displayError(msg,error);
}
