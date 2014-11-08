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
    var nav = d3.select("#floornav");

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
