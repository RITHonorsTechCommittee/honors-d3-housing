// Software developed by Reginald Pierce for the RIT Honors Program
// Redistribution or use in any form without express permission
// of the RIT Honors Program and Reginald Pierce is strictly
// prohibited.

// All code is contained in the housing namespace
var housing = {
	/**
	 * Loads data for a floor
	 *
	 * The load function takes JSON data representing a floor
	 * plan (with registration information) and displays the
	 * data on the provided d3.js SVG element.
	 *
	 * @param data The JSON.  The format should follow from
	 * 	/tests/sample.json
	 * @param d3svg An SVG element in which to draw the data.
	 */
	load: function(data,d3svg) {
		if(!data.number) return;
		// this href will need to be changed
		var imghref = "../img/049-"+data.number+".png";
		var img = d3svg.select(".bgimage");
		if(img.empty()){
			d3svg.append("image")
				.attr("class",".bgimage")
				.attr("x",0)
				.attr("y",0)
				.attr("width",1024)
				.attr("height",1325)
				//will we have the right xmlns for this?
				.attr("xlink:href",imghref);
		}else{
			img.attr("xlink:href",imghref);
		}
		d3svg.selectAll("circle")
				.data(data.rooms)
			.enter()
				.append("circle")
				.attr("cx",housing.style.x)
				.attr("cy",housing.style.y)
				.attr("r",housing.style.r)
				.attr("fill",housing.style.color)
		//Will that be enough?
	},

	/**
	 * The style namespace contains functions to style d3 elements
	 */
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
}
