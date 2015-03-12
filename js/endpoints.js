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
housing.endpoints.serverError = "A server error has occurred. Please tell the developers of this website that there was a server error in ";
housing.endpoints.apiError = "A client API error has occurred. Please tell the developers of this website that there was an API error in ";
housing.endpoints.unauthorizedError = "You are not authorized to register for housing. Please check that you are logged in with an RIT Google account";

/**
 * Loads Google APIs, attempts to authorize the application, and
 * sets up the signin/change user button.
 *
 * If the user is using multiple signin, any g.rit.edu domain accounts
 * will be preferred, otherwise normal precedence is used.
 *
 * @return a promise that will return whether the user is logged in
 *      or throw an error if the APIs could not be loaded
 */
housing.endpoints.login = function() {
    // By making these promises, we can ensure they only load once
    housing.endpoints._apipromises = housing.endpoints._apipromises || [
        gapi.client.load('housing', 'v1', null, housing.endpoints.hostname+"/_ah/api"),
        gapi.client.load('oauth2', 'v2'),
    ];

    return Promise.all(housing.endpoints._apipromises).then(function(results){
        // If the apis load successfully, login and get the user info
        return new Promise(function(fulfill,reject){
            housing.endpoints.authorize( true, fulfill );
        })
        .then(housing.endpoints.getUserInfo);
    });
};

/**
 * Start OAuth2 auth flow.  If immediate is set to true, an account
 * from the domain 'g.rit.edu' will be selected if possible, otherwise
 * normal account precedence applies.
 *
 * If you are just starting the housing app, you should use
 * `housing.endpoints.login` because it combines api loading, authorization,
 * and `housing.endpoints.getUserInfo` into one function.  However, `login`
 * only works with `immediate` set to true because asynchonous functions
 * cannot create popups.
 *
 * @see gapi.auth.authorize for details of the authorization flow
 *
 * @param immediate if true, the function will return without creating a dialog
 * @param callback a function to call with the authorization results
 */
housing.endpoints.authorize = function( immediate, callback ){
    var authparams = {
        client_id: housing.endpoints.clientId,
        scope: housing.endpoints.scopes,
        immediate: immediate,
    };
    if( immediate ) {
        authparams.hd = 'g.rit.edu';
    } else {
        authparams.authuser = '';
    }
    gapi.auth.authorize(authparams, callback )
};

/**
 * Loads the user info into the signin/change user button.
 *
 * @return a promise which returns true if a user is logged in
 */
housing.endpoints.getUserInfo = function() {
    return Promise.resolve(gapi.client.oauth2.userinfo.get())
        .catch(Promise.resolve)
        .then(function(result){
            if(result.result) {
                // A response was received
                d3.select("#username").html(null)
                    .append("a")
                    .attr("title","Click to change accounts")
                    .text(result.result.email ? result.result.email : "Sign In");
            }
            return result.result && result.result.email;
        });
};

/**
* Wraps gapi.client.housing.housing.rooms
*
* Returns a promise which will be fulfilled with the floor list.
* If the API is unavailable, a sample list of rooms from spec.json is returned
*
* @return a Promise that resolves to the floor list
*/
housing.endpoints.load = function() {
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.rooms) {
        return Promise.resolve(gapi.client.housing.housing.rooms());
    } else {
        return new Promise(function(fulfill,reject) {
            d3.json("/spec.json",function(err,jsonobj){
                if(jsonobj){
                    fulfill({"result":{"floors":jsonobj.floors}});
                } else {
                    reject({"result":{"error":{ "code":600, "message": err}}});
                }
            });
        });
    }
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
        return Promise.resolve(gapi.client.housing.housing.current());
    } else {
        return Promise.reject({"result":{"error":{ "code":600, "message": "API Not Available"}}});
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
        return Promise.resolve(gapi.client.housing.housing.reserve({"number":num}));
    } else {
        return Promise.reject({"result":{"error":{ "code":600, "message": "API Not Available"}}});
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
        return Promise.resolve(gapi.client.housing.housing.deleteReservation());
    } else {
        return Promise.reject({"result":{"error":{ "code":600, "message": "API Not Available"}}});
    }
};

/**
 * Loads all four lists: students, rooms, admins, and editors and returns a
 * thenable that will call the success callback with an array containing all
 * the lists
 *
 * If the API is unavailable, `adminspec.json` is loaded an the array contained
 * in its "d" property is returned.
 *
 * @return promise which will provide an array of list objects in resp.result if
 *          the request is successful
 */
housing.endpoints.loadAdmin = function() {
    // define processing functions
    
    //silently ignore not found/not authenticated errors
    //while rethrowing all other errors
    var err = function(resp) {
        if(resp.result && resp.result.error && resp.result.error.code) {
            var code = resp.result.error.code;
            if( 401 == code || 404 == code ) {
                return null;
            }
        }
        throw resp;
    };
    //extract the result object
    var transform = function(resp) {
        if(resp && resp.result) {
            return resp.result;
        } else {
            return resp;
        }
    };
    //remove null, false, or undefined values from the array
    var stripnulls = function(arry) {
        return arry.filter(function(d){return d != undefined;});
    };

    //build list of promises
    var listpromises = [];
    if(window.gapi && gapi.client.housing){
        listpromises.push(Promise.resolve(gapi.client.housing.housing.getStudentList()).catch(err).then(transform));
        listpromises.push(Promise.resolve(gapi.client.housing.housing.getRoomList()).catch(err).then(transform));
        listpromises.push(Promise.resolve(gapi.client.housing.housing.getAdminList()).catch(err).then(transform));
        listpromises.push(Promise.resolve(gapi.client.housing.housing.getEditorList()).catch(err).then(transform));
    }
    return Promise.all(listpromises).then(stripnulls);
};

/**
 * Wraps gapi.client.housing.housing.isOpen
 */
housing.endpoints.isOpen = function() {
    if(window.gapi && gapi.client.housing && gapi.client.housing.housing.isOpen) {
        return gapi.client.housing.housing.isOpen();
    } else {
        return Promise.reject({"result":{"error":{ "code":600, "message": "API Not Available"}}});
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
    // unpack error if necessary
    if( error.error ) {
        error = error.error;
    }
    // pick suitable default for source
    if( source == null ) {
        if( error.source ) {
            source = error.source;
        } else {
            source = 'generic';
        }
    }
    var msg = "";
    if( error.code == 401 ) {
        msg = housing.endpoints.unauthorizedError;
        if(error.message.contains('@')){
            msg += "<br><br>"+error.message;
        }
    } else if( error.code == 600 ) {
        msg = housing.endpoints.apierror + "'" + source + "'<br><br>" + error.message;
    } else {
        if( error.code >= 500 ) {
            msg = housing.endpoints.serverError + "'"+source+"'";
        } else {
            if(window.console && console.warn){
                console.warn("housing.endpoints.unauthorized called with unrecognized error!");
            }
            msg = error.message;
        }
    }
    housing.endpoints.displayError(msg,error);
}
