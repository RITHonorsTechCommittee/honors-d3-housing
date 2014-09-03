var housing = {
    // The init function is called to start up the app
    init: function(d3svg) {
        // Set up fancy tooltips for the rooms
        housing.tooltip = d3.tip()
            .attr("class","tooltip")
            .html(function(d) {
                return "<strong>"+d.number+"</strong>";
            });
        d3svg.call(housing.tooltip);
    },

    // Loads a specific floor given the complete data set and the SVG canvas
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
                var rooms = d3svg.selectAll("circle")
                    .data(data[i].rooms)
                // Remove excess circles if needed
                rooms.exit().remove();
                // Add more circles if needed
                rooms.enter()
                    .append("circle")
                    .attr("cx",housing.style.x)
                    .attr("cy",housing.style.y)
                    .attr("r",housing.style.r)
                    .attr("fill",housing.style.color)
                    .on("mouseover",housing.tooltip.show)
                    .on("mouseout",housing.tooltip.hide);
            }
        }
    },

    // The style object contains functions to style the room elements
    style: {
        x: function(d){ return d.x; },
        y: function(d){ return d.y; },
        color: function(d){ 
            if(0 == d.occupants.length){
                return "#00ff00";
            }else if(d.occupants.length == d.capacity){
                return "#ff0000";
            }else{
                return "#0000ff";
            }
        },
        r: function(d){ return 4*Math.sqrt(Math.abs(10.5*d.capacity - 1)); }
    }
};

