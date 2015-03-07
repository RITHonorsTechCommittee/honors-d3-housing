// Software developed by Reginald Pierce for the RIT Honors Program
// Redistribution or use in any form without express permission
// of the RIT Honors Program and Reginald Pierce is strictly
// prohibited.

// Ensure namespace housing exists
var housing = housing || {};
housing.admin = housing.admin || {};

/**
 * housing.admin.start
 *
 * This is the entry point for the housing selection application admin page.
 */
housing.admin.start = function(authorized) {
    // Select active elements of page
    // These are regions that will be filled by housing.js
    var nav = d3.select("#floornav");

    if(authorized) {
        // If authorized, clear the navigation bar and the SVG element
        nav.html(null);
        var main = d3.select("#selection")
            .html(null)
            .append("div")
            .classed("row",true);

        housing.endpoints.loadAdmin().then(
            function(data,open){
                housing.admin.init(main,nav,data);
                housing.admin.load(floors,floor,svg);
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
 * housing.admin.init
 *
 * Creates navigation buttons and containers for lists
 *
 * @param main       An HTML element (with class row) in which to place lists
 * @param nav        An HTML element where navigation buttons are placed
 * @param data       A JSON element containing the rooms and floors
 */
housing.admin.init = function(main,nav,data) {
    console.log("Initializing Housing Admin")
    //set up the tool tip
    housing.admin.tooltip = d3.tip()
        .attr("class","d3-tip")
        .html(housing.admin.style.tooltip);
    main.call(housing.admin.tooltip);
       
    // Create navigation
    if( nav ) {
        // Clear old stuff
        nav.html(null);
        
        // Load open/closed state of form
        housing.endpoints.isOpen().then(function(resp){
            // Don't add any components until we know that this is supported
            var switch_container = nav.append("div")
                .classed("row",true);

            var switch_fieldset = switch_container.append("div")
                .classed("small-2 columns",true)
            .append("fieldset")
                .classed("switch round large",true)
                .attr("tabindex",0);
            var switch_checkbox = switch_fieldset.append("input")
                .attr("type", "checkbox")
                .attr("id", "openswitch")
                .attr("checked", "checked");
            switch_fieldset.append("label")
                .attr("for","openswitch");

            housing.admin.isOpen = resp.result.isOpen
            switch_container.append("div")
                .classed("switch-label small-10 columns", true)
                .attr("id", "openswitch-label");
                .html("Housing Form "+((housing.admin.isOpen)?"Open":"Closed"));
        },function(resp){
            switch(resp.result.error.code){
                case 401: 
                    housing.endpoints.errorHelper(resp.result.error,'isOpen()'); break;
                case 404: case 600: 
                    break;
                default:
                    housing.endpoints.displayError(housing.endpoints.serverError+"'isOpen()'",resp.result.error); break;
            }
        });
    }
};

/**
 * housing.admin.load
 *
 * Loads a specific floor on the map view.
 *
 * @param data The JSON.  The format should follow from
 *     /tests/sample.json
 * @param floor The floor to render
 * @param d3svg An SVG element in which to draw the data.
 */
housing.admin.load = function(data,floor,d3svg) {
    console.log("Loading Floor "+floor);
    // Disable the button for the current floor
    d3.selectAll(".floors .disabled").classed("disabled",false);
    d3.select(".floors [name=floor"+floor+"]").classed("disabled",true);
    
    // Store parameters for use by click handlers
    housing.admin.d3svg = d3svg;
    housing.admin.currentFloor = floor;
    housing.admin.currentData = data;
    
    // Get floor images
    var floorimgs = d3svg.selectAll("image");
    // update data
    floorimgs.data(data)
         // set visibility base on new data
        .attr("visibility",housing.admin.style.imgvisibility)
    
        // add new images if necessary and style them appropriately
        .enter()
            .append("image")
                .attr("x",0)
                .attr("y",0)
                .attr("width",768)
                .attr("height",609)
                .attr("xlink:href",housing.admin.style.imghref)
                .attr("visibility",housing.admin.style.imgvisibility);
                
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
                .attr("transform",housing.admin.style.transform)
                .attr("class","circle")
                .on("click", housing.admin.clickRoom);

            // Allow for tooltips if defined.
            if(housing.admin.tooltip){
                group.on("mouseover",housing.admin.showTooltip)
                    .on("mouseout",housing.admin.tooltip.hide);
            }

            // Shade room on mouseover
            group.append("path")
                .attr("d", housing.admin.style.bgpath)
                .classed("shading",true)
                .attr("fill", "black")
                .attr("opacity", 0);
            
            // Add the base layer of the occupancy indicator
            group.append("circle")
                .attr("r",housing.admin.style.r)
                .attr("class",housing.admin.style.color.empty)
                .attr("stroke","black");

            // Create a SVG path specification for an arc that indicates occupancy
            var arc1 = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(housing.admin.style.r)
                .startAngle(0)
                .endAngle(housing.admin.style.endAngle);
            // Add the arc path to the group
            group.append("path")
                .attr("d", arc1)
                .attr("class",housing.admin.style.color);

            // Add the room number (an SVG <text> element)
            group.append("text")
                .text(housing.admin.style.title)
                .attr("text-anchor","middle")
                .attr("dy",housing.admin.style.titleOffset);
        }
    }
    $("#loading").hide();
};

/**
 * Handles clicks on rooms
 */
housing.admin.clickRoom = function(d,i) {
    if( housing.endpoints && housing.endpoints ) {
        // reserve a room
        housing.endpoints.reserve(d.number).then(function(resp){
            housing.admin.load(resp.result.floors,housing.admin.currentFloor,housing.admin.d3svg);
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
        var data = housing.admin.currentData;
        for( var k = 0; k < data.length; k += 1 ) {
            if( data[k].number == housing.admin.currentFloor ) {
                data[k].rooms[i].occupants = d.occupants + 1;
                break;
            }
        }
        housing.admin.load(data,housing.admin.currentFloor,housing.admin.d3svg);
    }
}

/**
 * Handles clicks to the clear reservation button
 */
housing.admin.clearReservation = function(d,i) {
    // only do stuff if the button is enabled
    if(!d3.select(".clear-reservation").classed("disabled")){
        if( housing.endpoints ) {
            housing.endpoints.deleteReservation().then(function(resp){
                housing.admin.currentData = resp.result.floors
                housing.admin.load(resp.result.floors,housing.admin.currentFloor,housing.admin.d3svg);
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
 * If housing.admin.tooltip.show is called directly from the onmouseover event, the
 * tooltip will show up over the element directly under the mouse.  By intercepting
 * the event, we are able to direct d3-tip to display the tooltip over the parent
 * <g> element.
 */
housing.admin.showTooltip = function() {
    var args = Array.prototype.slice.call(arguments);
    var elem = d3.event.target;
    args.push(elem.parentNode);

    housing.admin.tooltip.show.apply(this,args);
}

/**
 * The style namespace contains functions to style d3 elements
 */
housing.admin.style = {
    transform: function(d){ return "translate("+d.x+" "+d.y+")"; },
    x: function(d){ return d.x; },
    y: function(d){ return d.y; },
    color: function(d){
        if(typeof d === "undefined") {
            return housing.admin.style.color;
        }
        // find color based on number of occupants
        if(0 == d.occupants){
            return housing.admin.style.color.empty;
        }else if(d.occupants == d.capacity){
            return housing.admin.style.color.full;
        }else{
            return housing.admin.style.color.partial;
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
        return housing.admin.style.r(d) + 10;
    },
    imghref: function(d) {
        return "/img/049-"+d.number+".png";
    },
    imgvisibility: function(d){ 
        if( housing.admin.currentFloor == d.number ) { 
            return "visible"; 
        } else { 
            return "hidden";
        }
    },
    bgpath: function(d) {
        if(housing.admin.style.paths.hasOwnProperty(d.bgpath)) {
            return housing.admin.style.paths[d.bgpath];
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

// Allow for statements of the form housing.admin.style.color.empty
housing.admin.style.color.empty = "color-empty";
housing.admin.style.color.partial = "color-partial";
housing.admin.style.color.full = "color-full";

