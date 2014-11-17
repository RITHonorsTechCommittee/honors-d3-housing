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
                group.on("mouseover",housing.tooltip.show)
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
            return "Nobody";
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
        switch(d.bgpath) {
            case 0:
                return "M26,50 v-75  h-52  v75  Z"; 
             case 1:
                return "M39,43 v-78  h-78  v78  Z";
             case 2:
                return "M39,50 v-75  h-78  v75  Z";
             case 3:
                return "M52,32 v-58  h-103 v58  Z";
             case 4:
                return "M51,63 v-113 h-102 v113 Z";
             case 5:
                return "M38,41 v-75  h-76  v75  Z";
             case 6:
                return "M26,37 v-75  h-51  v75  Z";
             case 7:
                return "M25,37 v-75  h-48  v75  Z";
             case 8:
                return "M40,37 v-75  h-80  v75  Z";
             case 9:
                return "M48,62 v-58  h51 v-59 h-153 v117 Z";
             case 10:
                return "M39,62 v-106 h-78  v106 Z";
             case 11:
                return "M51,60 v-110 h-102 v110 Z";
             case 12:
                return "M51,31 v-58  h-102 v58  Z";
             case 13:
                return "M53,46 v-75  h-105 v75  Z";
             case 14:
                return "M26,44 v-75  h-51  v75  Z";
             case 15:
                return "M26,38 v-75  h-51  v75  Z";
             case 16:
                return "M38,38 v-75  h-76  v75  Z"; 
             case 17:
                return "M26,38 v-75  h-52  v75  Z";
             case 18:
                return "M50,60 v-118 h-102 v118 Z";
             case 19:
                return "M38,45 v-75  h-76  v75  Z";
             case 20:
                return "M52,32 v-60  h-103 v60  Z"; 
             default: 
                return;
         }
    }
};

// Allow for statements of the form housing.style.color.empty
housing.style.color.empty = "color-empty";
housing.style.color.partial = "color-partial";
housing.style.color.full = "color-full";

