// Ensure namespace housing exists
var housing = housing || {};

/**
 * housing.app
 *
 * This is the entry point for the housing selection application.
 * This function sets up elements on the page for the housing library
 * functions in housing.js so that changes can be made to the page
 * template HTML without interfering with the operation of the
 * housing.js library.
 */
housing.app = function(authorized) {
    // Select active elements of page
    // These are regions that will be filled by housing.js
    var nav = d3.select("#floornav");

    if(authorized) {
        // If authorized, clear the navigation bar and the SVG element
        nav.html(null);
        var svg = d3.select("#selection")
            .html(null)
            .append("svg")
            .attr("width",768)
            .attr("height",609);

        housing.client.load(svg,nav);
    } else {
        // If not signed in, clear navigation and insert signin button.
        nav.html(null);
        nav.append("a")
            .classed("button",true)
            .text("Sign In")
            .on("click",housing.auth.click);
    }
}


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
        immediate: true,
        hd: "g.rit.edu",
    }, housing.auth.result);
};

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


housing.auth.click = function(evt) {
    gapi.auth.authorize({
        client_id: housing.auth.clientId,
        scope: housing.auth.scopes,
        immediate: false,
        authuser: "",
    }, housing.auth.result);
    return false;
}

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
                if(floor == undefined) {
                    floor = jsonobj.floors[0].number;
                }
                housing.init(svg,nav,jsonobj.floors,true);
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

// Software developed by Reginald Pierce for the RIT Honors Program
// Redistribution or use in any form without express permission
// of the RIT Honors Program and Reginald Pierce is strictly
// prohibited.

// All code is contained in the housing namespace
var housing = housing || {};
    
/**
 * Starts the housing selection app
 *
 * Currently this function sets up tooltips for the data
 * and creates a navigation element.
 *
 * @param d3svg An SVG element in which the data will be drawn.
 */
housing.init = function(d3svg,nav,data,enableTooltip) {
    console.log("Initializing Housing App")
    // Set up fancy tooltips for the rooms
    if(typeof enableTooltip === "undefined"){
        // Default is not enabled
        enableTooltip = false;
    }
    if(enableTooltip){
        housing.tooltip = d3.tip()
            .attr("class","d3-tip")
            .html(housing.style.tooltip);
        d3svg.call(housing.tooltip);
    }
       
    // Create navigation
    if( nav && data && data.length ) {
        // Clear old stuff
        nav.html(null);
        
        //Set up button groups
        var floors = nav.append("ul")
            .classed("floors button-group",true);
        var otherbuttons = nav.append("ul")
            .classed("button-group round",true);
        floors.selectAll("li")
                .data(data)
            .enter()
                .append("li")
                .append("a") // Each button is an <a> inside a <li>
                    .attr("href","#")
                    .attr("name",function(d){ return "floor"+d.number; })
                    .classed("button",true)
                    .classed("disabled",true)
                    .text(function(d){ return "Floor "+d.number; })
                    .on("click", function(d){ 
                        housing.load(data,d.number,d3svg);
                        d3.event.preventDefault();
                    });

        // Create clear reservation button
        var currentReservation = 
            otherbuttons.append("li")
                .append("a")
                    .classed("button alert",true)
                    .text("Current Reservation: ")
                    .append("span")
                        .classed("current-reservation",true);
        var clearReservation = otherbuttons.append("li")
            .append("a")
                .attr("href","#")
                .classed("button alert clear-reservation disabled",true)
                .text("Clear Reservation")
                .on("click",housing.clearReservation);

        // Start loading current reservation
        //TODO: don't remove loading indication until this is done.
        housing.client.current().then(function(resp){
            clearReservation.classed("disabled",false);
            currentReservation.text(resp.result.roomNumber);
        },function(resp){
            switch(resp.result.error.code){
                case 401: 
                    housing.client.errorHelper(resp.result.error,'current()'); break;
                case 404: case 600: 
                    clearReservation.classed("disabled",true); currentReservation.text("None"); break;
                default:
                    housing.client.displayError(housing.client.serverError+"'current()'",resp.result.error); break;
            }
        });
    }
};

/**
 * Loads data for a floor
 *
 * The load function takes JSON data representing a floor
 * plan (with registration information) and displays the
 * data on the provided d3.js SVG element.
 *
 * @param data The JSON.  The format should follow from
 *     /tests/sample.json
 * @param floor The floor to render
 * @param d3svg An SVG element in which to draw the data.
 */
housing.load = function(data,floor,d3svg) {
    console.log("Loading Floor "+floor);
    // Disable the button for the current floor
    d3.selectAll(".floors .disabled").classed("disabled",false);
    d3.select(".floors [name=floor"+floor+"]").classed("disabled",true);
    
    // Store parameters for use by click handlers
    housing.d3svg = d3svg;
    housing.currentFloor = floor;
    housing.currentData = data;
    
    // Get floor images
    var floorimgs = d3svg.selectAll("image");
    // update data
    floorimgs.data(data)
         // set visibility base on new data
        .attr("visibility",housing.style.imgvisibility)
    
        // add new images if necessary and style them appropriately
        .enter()
            .append("image")
                .attr("x",0)
                .attr("y",0)
                .attr("width",768)
                .attr("height",609)
                .attr("xlink:href",housing.style.imghref)
                .attr("visibility",housing.style.imgvisibility);
                
    // It is simplest just to remove all circles to make sure they update correctly
    d3svg.selectAll(".circle").remove();

    // Loop through the floors to find the current floor
    for( var i = 0; i < data.length; i += 1 ){
        if( data[i].number == floor ){
            // Select all groups with class circle in the SVG canvas
            // and bind them to the rooms on the floor
            var rooms = d3svg.selectAll(".circle")
                .data(data[i].rooms);
            
            // Each room gets a group (an SVG <g> element) to hold the
            // occupancy indicator and room number
            var group = rooms.enter().append("g")
                .attr("transform",housing.style.transform)
                .attr("class","circle")
                .on("click", housing.clickRoom);

            // Allow for tooltips if defined.
            if(housing.tooltip){
                group.on("mouseover",housing.showTooltip)
                    .on("mouseout",housing.tooltip.hide);
            }

            // Shade room on mouseover
            group.append("path")
                .attr("d", housing.style.bgpath)
                .classed("shading",true)
                .attr("fill", "black")
                .attr("opacity", 0);
            
            // Add the base layer of the occupancy indicator
            group.append("circle")
                .attr("r",housing.style.r)
                .attr("class",housing.style.color.empty)
                .attr("stroke","black");

            // Create a SVG path specification for an arc that indicates occupancy
            var arc1 = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(housing.style.r)
                .startAngle(0)
                .endAngle(housing.style.endAngle);
            // Add the arc path to the group
            group.append("path")
                .attr("d", arc1)
                .attr("class",housing.style.color);

            // Add the room number (an SVG <text> element)
            group.append("text")
                .text(housing.style.title)
                .attr("text-anchor","middle")
                .attr("dy",housing.style.titleOffset);
        }
    }
    $("#loading").hide();
};

/**
 * Handles clicks on rooms
 */
housing.clickRoom = function(d,i) {
    if( housing.auth && housing.client ) {
        // reserve a room
        housing.client.reserve(d.number).then(function(resp){
            housing.load(resp.result.floors,housing.currentFloor,housing.d3svg);
            d3.select('.current-reservation').text(d.number);
            d3.select('.clear-reservation').classed('disabled',false);
        },function(resp){
            housing.client.errorHelper(resp.result.error,'reserve()');
        },this);
        $("#loading").show();
    } else {
        // this is just for demo purposes
        // loop through the data until the clicked room is found
        // and add one to the occupants number. This simulates
        // new data being returned from the housing.client.reserve
        // method.
        var data = housing.currentData;
        for( var k = 0; k < data.length; k += 1 ) {
            if( data[k].number == housing.currentFloor ) {
                data[k].rooms[i].occupants = d.occupants + 1;
                break;
            }
        }
        housing.load(data,housing.currentFloor,housing.d3svg);
    }
}

/**
 * Handles clicks to the clear reservation button
 */
housing.clearReservation = function(d,i) {
    // only do stuff if the button is enabled
    if(!d3.select(".clear-reservation").classed("disabled")){
        if( housing.auth && housing.client ) {
            housing.client.deleteReservation().then(function(resp){
                housing.load(resp.result.floors,housing.currentFloor,housing.d3svg);
                d3.select('.current-reservation').text('None');
                d3.select('.clear-reservation').classed("disabled",true);
            },function(resp){
                housing.client.errorHelper(resp.result.error,'deleteReservation()');
            },this);
            $("#loading").show();
        } else {
            alert("API not available");
        }
    }
    d3.event.preventDefault();
}

/**
 * Handles tooltip mouseover events
 *
 * If housing.tooltip.show is called directly from the onmouseover event, the
 * tooltip will show up over the element directly under the mouse.  By intercepting
 * the event, we are able to direct d3-tip to display the tooltip over the parent
 * <g> element.
 */
housing.showTooltip = function() {
    var args = Array.prototype.slice.call(arguments);
    var elem = d3.event.target;
    args.push(elem.parentNode);

    housing.tooltip.show.apply(this,args);
}

/**
 * The style namespace contains functions to style d3 elements
 */
housing.style = {
    transform: function(d){ return "translate("+d.x+" "+d.y+")"; },
    x: function(d){ return d.x; },
    y: function(d){ return d.y; },
    color: function(d){
        if(typeof d === "undefined") {
            return housing.style.color;
        }
        // find color based on number of occupants
        if(0 == d.occupants){
            return housing.style.color.empty;
        }else if(d.occupants == d.capacity){
            return housing.style.color.full;
        }else{
            return housing.style.color.partial;
        }
    },
    r: function(d){ return 4*Math.sqrt(Math.abs(10.5*d.capacity - 1)); },
    endAngle: function(d){ return 6.28319 * d.occupants / d.capacity; },
    tooltip: function(d) {
        if(d && d.occupantNames){
            return d.occupantNames.join("<br>");
        } else {
            return null;
        }
    },
    title: function(d) {
        return d.number;
    },
    titleOffset: function(d) {
        return housing.style.r(d) + 10;
    },
    imghref: function(d) {
        return "/img/049-"+d.number+".png";
    },
    imgvisibility: function(d){ 
        if( housing.currentFloor == d.number ) { 
            return "visible"; 
        } else { 
            return "hidden";
        }
    },
    bgpath: function(d) {
        if(housing.style.paths.hasOwnProperty(d.bgpath)) {
            return housing.style.paths[d.bgpath];
        } else {
            return d.bgpath;
        }
    },
    paths: {
        "0": "M26,50 v-75  h-52  v75  Z", 
        "1": "M39,43 v-78  h-78  v78  Z",
        "2": "M39,50 v-75  h-78  v75  Z",
        "3": "M52,32 v-58  h-103 v58  Z",
        "4": "M51,63 v-113 h-102 v113 Z",
        "5": "M38,41 v-75  h-76  v75  Z",
        "6": "M26,37 v-75  h-51  v75  Z",
        "7": "M25,37 v-75  h-48  v75  Z",
        "8": "M40,37 v-75  h-80  v75  Z",
        "9": "M48,62 v-58  h51 v-59 h-153 v117 Z",
        "10": "M39,62 v-106 h-78  v106 Z",
        "11": "M51,60 v-110 h-102 v110 Z",
        "12": "M51,31 v-58  h-102 v58  Z",
        "13": "M53,46 v-75  h-105 v75  Z",
        "14": "M26,44 v-75  h-51  v75  Z",
        "15": "M26,38 v-75  h-51  v75  Z",
        "16": "M38,38 v-75  h-76  v75  Z", 
        "17": "M26,38 v-75  h-52  v75  Z",
        "18": "M50,60 v-118 h-102 v118 Z",
        "19": "M38,45 v-75  h-76  v75  Z",
        "20": "M52,32 v-60  h-103 v60  Z", 
    },
};

// Allow for statements of the form housing.style.color.empty
housing.style.color.empty = "color-empty";
housing.style.color.partial = "color-partial";
housing.style.color.full = "color-full";

