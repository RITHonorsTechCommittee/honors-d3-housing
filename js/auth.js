/**
* Establishes a connection to the Google Endpoints server
*/
var housing = housing || {};

housing.auth = housing.auth || {};

housing.auth.clientId = '180343920180-41f9qsqdcf9it1poolqtqages644lgs3.apps.googleusercontent.com';

housing.auth.scopes = 'https://www.googleapis.com/auth/userinfo.email';

housing.auth.hostname = 'https://rithonorshousing.appspot.com';

/**
* Performs a check when all apis are loaded
*/
housing.auth.init = function() {
    var apisToLoad;
    var loadCallback = function() {
        if(--apisToLoad == 0) {
            housing.auth.check();
        }
    };

    apisToLoad = 2;
    gapi.client.load('housing', 'v1', loadCallback, housing.auth.hostname+"/_ah/api");
    gapi.client.load('oauth2', 'v2', loadCallback);
};

/**
* Checks if the user is logged in already. Will give precedence to RIT accounts
* 
* Passes credentials to housing.auth.result
*/
housing.auth.check = function() {
    gapi.auth.authorize({
        client_id: housing.auth.clientId,
        scope: housing.auth.scopes,
        immediate: true,
        hd: "g.rit.edu",
    }, housing.auth.result);
};

/**
* Starts the app. If the user is logged in, it puts their email in the title bar.
*/
housing.auth.result = function(result) {
    if(housing.app) {
        // Start the housing app with a boolean
        // indicating whether or not the user is signed in
        housing.app((result && !result.error));
    } else {
        housing.client.displayError("The application code is missing. Please contact the developers");
    }

    // Get the user's email
    gapi.client.oauth2.userinfo.get().then(function(resp){
        // Put the email in the top bar so users can see which account they are logged in under
        d3.select(".username").html(null)
            .append("a")
            .on("click", housing.auth.click)
            .attr("title","Click to change accounts")
            .text(resp.result.email);
    },function(resp){
        if(window.console && console.log){
            console.log(resp.result.error);
        }
        // Restart app in unauthenticated mode.
        setTimeout(housing.app,0,false);
    });
}


/**
* Event handler that executes when the user clicks the sign in/sign out button
*/
housing.auth.click = function(evt) {
    gapi.auth.authorize({
        client_id: housing.auth.clientId,
        scope: housing.auth.scopes,
        immediate: false,
        authuser: "",
    }, housing.auth.result);
    return false;
}
