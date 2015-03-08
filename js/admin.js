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
            function(data){
                data = data.sort(housing.admin.style.listSorter);
                housing.admin.init(main,nav,data);
                housing.admin.load(data);
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
 * Creates navigation buttons 
 *
 * @param main       An HTML element (with class row) in which to place lists
 * @param nav        An HTML element where navigation buttons are placed
 * @param data       A JSON element containing the rooms and floors
 */
housing.admin.init = function(main,nav,data) {
    console.log("Initializing Housing Admin")
    housing.admin.mainelement = main;
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
            var labeltext = housing.admin.isOpen ? "Open" : "Closed";
            switch_container.append("div")
                .classed("switch-label small-10 columns", true)
                .attr("id", "openswitch-label")
                .html("Housing Form "+labeltext);
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
    } // end if(nav)

    //create list containers
    var containers = main.selectAll("section").data(data);

    containers.exit().remove();

    // add new as needed
    var enter = containers.enter()
        .append("div")
            .classed("small-12 large-6 columns",true)
        .append("section")
            .classed("list-section",true);
    var header = enter.append("header").classed("list-header",true);
    header.append("h1");
    header.append("button")
        .classed("tiny round button",true)
        .on("click",housing.admin.clickAdd)
        .append("i").classed("fi-plus",true);
    header.append("button")
        .classed("tiny round alert button",true)
        .on("click",housing.admin.clickRemove)
        .append("i").classed("fi-x",true);
    enter.append("div")
        .classed("list-area",true)
   
    // update
    containers.select("h1").html(housing.admin.style.title);

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
housing.admin.load = function(data) {
    var listitems = housing.admin.mainelement.selectAll("section .list-area")
            .data(data)
        .selectAll("span.list-item")
            .data(function(d,i){ return d.strings; });

    listitems.exit().remove();

    listitems.enter().append("span")
        .classed("label secondary deletable",true)
        .on("click", housing.admin.clickRemoveIndividual);

    listitems.html(housing.admin.style.simple);
    
    $("#loading").hide();
};

/**
 * Handles clicks on "plus" button in header
 */
housing.admin.clickAdd = function(d,i) {
}

/**
 * Handles clicks on "x" button in header
 */
housing.admin.clickRemove = function(d,i) {
}

housing.admin.clickRemoveIndividual = function(d,i) {
}

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
 * The style namespace contains functions to style d3 elements
 */
housing.admin.style = {
    /* Sort objects by obj.key.  If they are in the "knownLists", they will be ordered
     * the same way as the known lists, otherwise they are treated as coming after the
     * known lists
     */
    listSorter:function(a,b){
        var knownLists = ['room list', 'student list', 'admin list', 'editor list'].reverse();
        if(a.key && b.key){
            return knownLists.indexOf(b.key.toLowerCase()) - knownLists.indexOf(a.key.toLowerCase());
        } else if( a.key ) {
            return 1;
        } else if( b.key ) {
            return -1;
        } else {
            return 0;
        }
    },
    title:function(d,i){
        return d.key;
    },
    simple:function(d,i){
        return d;
    }
};

