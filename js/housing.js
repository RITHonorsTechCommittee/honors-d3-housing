var housing = {
	init: function() {
		housing.tooltip = d3.select("body").append("div")
			.attr("class","tooltip")
			.style("opacity", 0);
	}

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
				.on("mouseover",tooltip_in)
				.on("mouseout",tooltip_out);
	},

	tooltip_in: function(d) {
		housing.tooltip.transition()
			.duration(200)
			.style("opacity", .9);
		var txt = d.number + ( (0 == d.occupants.length)?"":"<br>" ) + d.occupants.join("<br>");
		housing.tooltip.html(txt)
			.style("left", (d3.event.pageX) + "px")
			.style("right", (d3.event.pageY) + "px");
	}
	tooltip_out: function(d) {
		housing.tooltip.transtion()
			.duration(500)
			.style("opacity",0);
	}
	
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
