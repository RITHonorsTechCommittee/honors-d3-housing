// Software developed by Reginald Pierce for the RIT Honors Program
// Redistribution or use in any form without express permission
// of the RIT Honors Program and Reginald Pierce is strictly
// prohibited.

// All code is contained in the housing namespace
var housing = {
    
    /**
     * Starts the housing selection app
     *
     * Currently this function sets up tooltips for the data
     * and creates a navigation element.
     *
     * @param d3svg An SVG element in which the data will be drawn.
     */
    init: function(d3svg,nav,data,enableTooltip) {
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
    },

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
    load: function(data,floor,d3svg) {
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
                
                // Add the base layer of the occupancy indicator
                group.append("circle")
                    .attr("r",housing.style.r)
                    .attr("fill",housing.style.color.empty)
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
                    .attr("fill",housing.style.color.partial);

                // Add the room number (an SVG <text> element)
                group.append("text")
                    .text(housing.style.title)
                    .attr("text-anchor","middle")
                    .attr("dy",housing.style.titleOffset);
            }
        }
    },

    /**
     * The style namespace contains functions to style d3 elements
     */
    style: {
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
        }
    }
};
// Allow for statements of the form housing.style.color.empty
housing.style.color.empty = "#00ff00";
housing.style.color.partial = "#0000ff";
housing.style.color.full = "#ff0000";

