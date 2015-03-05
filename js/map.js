// Software developed by Reginald Pierce for the RIT Honors Program
// Redistribution or use in any form without express permission
// of the RIT Honors Program and Reginald Pierce is strictly
// prohibited.

// Ensure namespace housing exists
var housing = housing || {};
housing.map = housing.map || {};

/**
 * housing.map.start
 *
 * This is the entry point for the housing selection application map view.
 * This function sets up elements on the page for the housing library
 * functions in housing.js so that changes can be made to the page
 * template HTML without interfering with the operation of the
 * housing.js library.
 */
housing.map.start = function(authorized) {
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

        housing.endpoints.load().then(
            function(floors,floor){
                housing.map.init(svg,nav,floors,true);
                housing.map.load(floors,floor,svg);
            });
    } else {
        // If not signed in, clear navigation and insert signin button.
        nav.html(null);
        nav.append("a")
            .classed("button",true)
            .text("Sign In")
            .on("click",housing.endpoints.click);
        // message for IE users
        nav.append("p").text("Note: there is a current bug with Google Sign In and Internet Explorer.  If you are using Internet Explorer and you end up with a blank window after sigining in, close the window and click Sign In again.");
        $("#loading").hide();
    }
}
    
/**
 * housing.map.init
 *
 * Initializes map view by setting up tooltips for the data
 * and creating a navigation element.
 *
 * @param d3svg 	 An SVG element in which the data will be drawn.
 * @param nav   	 An HTML element where navigation buttons are placed
 * @param data  	 A JSON element containing the rooms and floors
 * @param enableTooltip  A boolean indicating whether to show a tool tip, default false
 */
housing.map.init = function(d3svg,nav,data,enableTooltip) {
    console.log("Initializing Housing App")
    // Set up fancy tooltips for the rooms
    if(typeof enableTooltip === "undefined"){
        // Default is not enabled
        enableTooltip = false;
    }
    if(enableTooltip){
	//set up the tool tip
        housing.map.tooltip = d3.tip()
            .attr("class","d3-tip")
            .html(housing.map.style.tooltip);
        d3svg.call(housing.map.tooltip);
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
                        housing.map.load(data, d.number, d3svg);
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
                .on("click",housing.map.clearReservation);

        // Start loading current reservation
        //TODO: don't remove loading indication until this is done.
        housing.endpoints.current().then(function(resp){
            clearReservation.classed("disabled",false);
            currentReservation.text(resp.result.roomNumber);
        },function(resp){
            switch(resp.result.error.code){
                case 401: 
                    housing.endpoints.errorHelper(resp.result.error,'current()'); break;
                case 404: case 600: 
                    clearReservation.classed("disabled",true); currentReservation.text("None"); break;
                default:
                    housing.endpoints.displayError(housing.endpoints.serverError+"'current()'",resp.result.error); break;
            }
        });
    }
};

/**
 * housing.map.load
 *
 * Loads a specific floor on the map view.
 *
 * @param data The JSON.  The format should follow from
 *     /tests/sample.json
 * @param floor The floor to render
 * @param d3svg An SVG element in which to draw the data.
 */
housing.map.load = function(data,floor,d3svg) {
    console.log("Loading Floor "+floor);
    // Disable the button for the current floor
    d3.selectAll(".floors .disabled").classed("disabled",false);
    d3.select(".floors [name=floor"+floor+"]").classed("disabled",true);
    
    // Store parameters for use by click handlers
    housing.map.d3svg = d3svg;
    housing.map.currentFloor = floor;
    housing.map.currentData = data;
    
    // Get floor images
    var floorimgs = d3svg.selectAll("image");
    // update data
    floorimgs.data(data)
         // set visibility base on new data
        .attr("visibility",housing.map.style.imgvisibility)
    
        // add new images if necessary and style them appropriately
        .enter()
            .append("image")
                .attr("x",0)
                .attr("y",0)
                .attr("width",768)
                .attr("height",609)
                .attr("xlink:href",housing.map.style.imghref)
                .attr("visibility",housing.map.style.imgvisibility);
                
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
                .attr("transform",housing.map.style.transform)
                .attr("class","circle")
                .on("click", housing.map.clickRoom);

            // Allow for tooltips if defined.
            if(housing.map.tooltip){
                group.on("mouseover",housing.map.showTooltip)
                    .on("mouseout",housing.map.tooltip.hide);
            }

            // Shade room on mouseover
            group.append("path")
                .attr("d", housing.map.style.bgpath)
                .classed("shading",true)
                .attr("fill", "black")
                .attr("opacity", 0);
            
            // Add the base layer of the occupancy indicator
            group.append("circle")
                .attr("r",housing.map.style.r)
                .attr("class",housing.map.style.color.empty)
                .attr("stroke","black");

            // Create a SVG path specification for an arc that indicates occupancy
            var arc1 = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(housing.map.style.r)
                .startAngle(0)
                .endAngle(housing.map.style.endAngle);
            // Add the arc path to the group
            group.append("path")
                .attr("d", arc1)
                .attr("class",housing.map.style.color);

            // Add the room number (an SVG <text> element)
            group.append("text")
                .text(housing.map.style.title)
                .attr("text-anchor","middle")
                .attr("dy",housing.map.style.titleOffset);
        }
    }
    $("#loading").hide();
};

/**
 * Handles clicks on rooms
 */
housing.map.clickRoom = function(d,i) {
    if( housing.endpoints && housing.endpoints ) {
        // reserve a room
        housing.endpoints.reserve(d.number).then(function(resp){
            housing.map.load(resp.result.floors,housing.map.currentFloor,housing.map.d3svg);
            d3.select('.current-reservation').text(d.number);
            d3.select('.clear-reservation').classed('disabled',false);
        },function(resp){
            housing.endpoints.errorHelper(resp.result.error,'reserve()');
        },this);
        $("#loading").show();
    } else {
        // this is just for demo purposes
        // loop through the data until the clicked room is found
        // and add one to the occupants number. This simulates
        // new data being returned from the housing.endpoints.reserve
        // method.
        var data = housing.map.currentData;
        for( var k = 0; k < data.length; k += 1 ) {
            if( data[k].number == housing.map.currentFloor ) {
                data[k].rooms[i].occupants = d.occupants + 1;
                break;
            }
        }
        housing.map.load(data,housing.map.currentFloor,housing.map.d3svg);
    }
}

/**
 * Handles clicks to the clear reservation button
 */
housing.map.clearReservation = function(d,i) {
    // only do stuff if the button is enabled
    if(!d3.select(".clear-reservation").classed("disabled")){
        if( housing.endpoints ) {
            housing.endpoints.deleteReservation().then(function(resp){
                housing.map.currentData = resp.result.floors
                housing.map.load(resp.result.floors,housing.map.currentFloor,housing.map.d3svg);
                d3.select('.current-reservation').text('None');
                d3.select('.clear-reservation').classed("disabled",true);
            },function(resp){
                housing.endpoints.errorHelper(resp.result.error,'deleteReservation()');
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
 * If housing.map.tooltip.show is called directly from the onmouseover event, the
 * tooltip will show up over the element directly under the mouse.  By intercepting
 * the event, we are able to direct d3-tip to display the tooltip over the parent
 * <g> element.
 */
housing.map.showTooltip = function() {
    var args = Array.prototype.slice.call(arguments);
    var elem = d3.event.target;
    args.push(elem.parentNode);

    housing.map.tooltip.show.apply(this,args);
}

/**
 * The style namespace contains functions to style d3 elements
 */
housing.map.style = {
    transform: function(d){ return "translate("+d.x+" "+d.y+")"; },
    x: function(d){ return d.x; },
    y: function(d){ return d.y; },
    color: function(d){
        if(typeof d === "undefined") {
            return housing.map.style.color;
        }
        // find color based on number of occupants
        if(0 == d.occupants){
            return housing.map.style.color.empty;
        }else if(d.occupants == d.capacity){
            return housing.map.style.color.full;
        }else{
            return housing.map.style.color.partial;
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
        return housing.map.style.r(d) + 10;
    },
    imghref: function(d) {
        return "/img/049-"+d.number+".png";
    },
    imgvisibility: function(d){ 
        if( housing.map.currentFloor == d.number ) { 
            return "visible"; 
        } else { 
            return "hidden";
        }
    },
    bgpath: function(d) {
        if(housing.map.style.paths.hasOwnProperty(d.bgpath)) {
            return housing.map.style.paths[d.bgpath];
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

// Allow for statements of the form housing.map.style.color.empty
housing.map.style.color.empty = "color-empty";
housing.map.style.color.partial = "color-partial";
housing.map.style.color.full = "color-full";

