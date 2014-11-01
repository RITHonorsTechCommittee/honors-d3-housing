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
    var nav = d3.select("#floornav .floors");

    if(authorized) {
        // If authorized, clear the navigation bar and the SVG element
        nav.html(null);
        var svg = d3.select("#selection")
            .html(null)
            .append("svg")
            .attr("width",768)
            .attr("height",609);

        // The initial floor number is hardcoded to 4b for simplicity
        housing.client.load(svg,nav,"4b");
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

housing.auth.init = function() {
    var apisToLoad;
    var loadCallback = function() {
        if(--apisToLoad == 0) {
            housing.auth.check();
        }
    };

    apisToLoad = 2;
    gapi.client.load('housing', 'v1', loadCallback, "https://rithonorshousing.appspot.com/_ah/api");
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

// Ensure housing namespace is available
var housing = housing || {};

housing.client = housing.client || {};

housing.client.load = function(svg,nav,floor) {
    // Load the floor. 
    if(gapi.client.housing) {
        // If the Google APIs are available, then get the list of
        // available rooms through them.
        gapi.client.housing.housing.rooms().then(
                function(resp) {
                    var floors = resp.result.floors;
                    housing.init(svg,nav,floors);
                    housing.load(floors,floor,svg);
                },
                function(err) {
                    //TODO: identify error and handle appropriately
                });
    } else {
        // display example rooms if api not available
        d3.json("/spec.json",function(err,jsonobj){
            if(jsonobj){
                housing.init(svg,nav,jsonobj.floors);
                housing.load(jsonobj.floors,floor,svg);
            }
        });
    }
};

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
    // Set up fancy tooltips for the rooms
    if(typeof enableTooltip === "undefined"){
        // Default is not enabled
        enableTooltip = false;
    }
    if(enableTooltip){
        housing.tooltip = d3.tip()
            .attr("class","tooltip")
            .html(housing.style.tooltip);
        d3svg.call(housing.tooltip);
    }
    
    // Create navigation
    if( nav && data && data.length ) {
        // In case it has been initialized before,
        // get rid of old buttons
        nav.selectAll("li").remove();
        // Add new buttons based on the data
        nav.selectAll("li")
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
 * 	/tests/sample.json
 * @param floor The floor to render
 * @param d3svg An SVG element in which to draw the data.
 */
housing.load = function(data,floor,d3svg) {
    // Disable the button for the current floor
    d3.selectAll("a.disabled").classed("disabled",false);
    d3.select("#floornav").select("ul").selectAll("li").select("[name=floor"+floor+"]").classed("disabled",true);
    
    // Sets up all the images so that the correct floor will always be visible
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
                .on("click",function(d,j){
                    //TODO: this is just for demo purposes
                    for( var k = 0; k < data.length; k += 1 ) {
                        if( data[k].number == floor ) {
                            data[k].rooms[j].occupants = d.occupants + 1;
                            housing.load(data,floor,d3svg);
                        }
                    }
                });

            // Allow for tooltips if defined.
            if(housing.tooltip){
                group.on("mouseover",housing.tooltip.show)
                    .on("mouseout",housing.tooltip.hide);
            }

            // Shade room on mouseover
            group.append("rect")
                .attr("x", housing.style.bgxOffset)
                .attr("y", housing.style.bgyOffset)
                .attr("width", housing.style.bgWidth)
                .attr("height", housing.style.bgHeight)
                .attr("fill", "black")
                .attr("opacity", 0)
            
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
};

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
        return "<strong>"+d.number+"</strong>";
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
    bgxOffset: function(d) {
        return d.bgx;
    },
    bgyOffset: function(d) {
        return d.bgy;
    },
    bgWidth: function(d) {
        return d.bgw;
    },
    bgHeight: function(d) {
        return d.bgh;
    }
};
// Allow for statements of the form housing.style.color.empty
housing.style.color.empty = "color-empty";
housing.style.color.partial = "color-partial";
housing.style.color.full = "color-full";

