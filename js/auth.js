
var housing = housing || {};

housing.auth = housing.auth || {};

housing.auth.clientId = '180343920180-41f9qsqdcf9it1poolqtqages644lgs3.apps.googleusercontent.com';

housing.auth.scopes = 'https://www.googleapis.com/auth/userinfo.email';

housing.auth.hostname = 'https://rithonorshousing.appspot.com';

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

housing.auth.check = function() {
    gapi.auth.authorize({
        client_id: housing.auth.clientId,
        scope: housing.auth.scopes,
        immediate: true
    }, housing.auth.result);
};

housing.auth.result = function(result) {
    if(housing.app) {
        // Start the housing app with a boolean
        // indicating whether or not the user is signed in
        housing.app((result && !result.error));
    } else {
        // fallback if housing app not defined?
    }
}


housing.auth.click = function(evt) {
    gapi.auth.authorize({
        client_id: housing.auth.clientId,
        scope: housing.auth.scopes,
        immediate: false
    }, housing.auth.result);
    return false;
}
