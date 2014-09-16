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
    init: function(d3svg,nav,data) {
        // Set up fancy tooltips for the rooms
        housing.tooltip = d3.tip()
            .attr("class","tooltip")
            .html(housing.style.tooltip);
        d3svg.call(housing.tooltip);
        // Create navigation
        if( nav && data && data.length ) {
            var li = nav.selectAll("li")
                .data(data);
            li.exit().remove()
            li.enter().append("li")
                .append("a")
                    .attr("href","#")
                    .text(function(d){ return "Floor "+d.number; })
                    .on("click", function(d){ 
                        housing.load(data,d.number,d3svg); 
                        return false;
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
        // Sets up all the images so that the correct floor will always be visible
        d3svg.selectAll("image")
                .data(data)
            .enter()
                .append("image")
                .attr("x",0)
                .attr("y",0)
                .attr("width",1024)
                .attr("height",1325)
                .attr("xlink:href",function(d){ return "/img/049-"+d.number+".png"; })
                .attr("visibility",function(d){ if( floor == d.number ){ return "visible"; }else{ return "hidden"; }});
                
        // Loop through the floors
        for( var i = 0; i < data.length; i += 1 ){
            // Find the floor we are looking for
            if( data[i].number == floor ){
                // Select all circles in the SVG canvas
                // and bind them to the rooms on the floor
                var rooms = d3svg.selectAll(".circle")
                    .data(data[i].rooms)
                // Remove excess circles if needed
                rooms.exit().remove();
                // Add more circles if needed
                
                var group = rooms.enter().append("g")
                    .attr("transform",housing.style.transform)
                    .attr("class","circle");
                if(housing.tooltip){
                    group.on("mouseover",housing.tooltip.show)
                        .on("mouseout",housing.tooltip.hide);
                }
                group.append("circle")
                    .attr("r",housing.style.r)
                    .attr("fill",housing.style.color.empty)
                    .attr("stroke","black");
                var arc1 = d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(housing.style.r)
                    .startAngle(0)
                    .endAngle(housing.style.endAngle);
                group.append("path")
                    .attr("d", arc1)
                    .attr("fill",housing.style.color.partial);
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
        }
    }
};
// Allow for statements of the form housing.style.color.empty
housing.style.color.empty = "#00ff00";
housing.style.color.partial = "#0000ff";
housing.style.color.full = "#ff0000";

