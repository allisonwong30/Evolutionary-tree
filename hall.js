var mammal_details;
var root;
d3.csv("HallMammalConservation2.csv", function(error, data){
  if (error) throw error;
  mammal_details = data;

});
var treeH;


if (screen.height> 900) {
  treeH = screen.height - (screen.height/5);
} else {
  treeH = 900;
}

var outerRadius = treeH / 2,
    innerRadius = outerRadius - 160;

var cluster = d3.cluster()
    .size([360, innerRadius])
    .separation(function(a, b) { return 1; });

var svg = d3.select("#tree").append("svg")
    .attr("width", outerRadius*2)
    .attr("height",  outerRadius*2);

var chart = svg.append("g")
    .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");
function convertHallName(hall){
  if (hall == "N AMERICAN MAMMALS") {
          return "Hall of North American Mammals";
        } else if (hall == "MAMMALS AND THEIR EXTINCT RELATIVES") {
          return "Hall of Mammals and their Extinct Relatives";
        } else if (hall == "HALL OF OCEAN LIFE") {
          return "Hall of Ocean Life";
        } else if (hall == "MAMMALS OF NY STATE") {
          return "Hall of Mammals of NY State";
        } else if (hall == "HALL OF PRIMATES") {
          return "Hall of Primates";
        } else if (hall == "HALL OF ASIAN MAMMALS") {
          return "Hall of Asian Mammals";
        } else if (hall == "HALL OF AFRICAN MAMMALS") {
          return "Hall of African Mammals";
        } else if (hall == "HALL OF BIODIVERSITY") {
          return "Hall of Biodiversity";
        } else if (hall == "HALL OF HUMAN ORIGINS") {
          return "Hall of Human Origins";
        }
        return "Not found";

}
d3.text("mammals_newick.txt", function(error, life) {
  if (error) throw error;

  root = d3.hierarchy(parseNewick(life), function(d) { return d.branchset; })
      .sum(function(d) { return d.branchset ? 0 : 1; })
      .sort(function(a, b) { return (a.value - b.value) || d3.ascending(a.data.length, b.data.length); });

  cluster(root);

  // var input = d3.select("#show-length input").on("change", changed),
  //     timeout = setTimeout(function() { input.property("checked", true).each(changed); }, 2000);

  setRadius(root, root.data.length = 0, innerRadius / maxLength(root));

  var linkExtension = chart.append("g")
      .attr("class", "link-extensions")
      .selectAll("path")
      .data(root.links().filter(function(d) { return !d.target.children; }))
      .enter().append("path")
      .each(function(d) { d.target.linkExtensionNode = this; })
      .attr("d", linkExtensionConstant);

  var link = chart.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(root.links())
      .enter().append("path")
      .each(function(d) { d.target.linkNode = this; })
      .attr("d", linkConstant)
      .attr("stroke", function(d) { return d.target.color; });

  chart.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(root.leaves())
      .enter().append("text")
      .each(function(d) {
        var sci_name =  d.data.name.replace(/_/g, " ");
        for (var index in mammal_details){
          var csv_mammal = mammal_details[index];
            if (csv_mammal.scientific == sci_name){
              d.data.common = csv_mammal.common;
              d.data.conservation = csv_mammal.conservation;
              d.data.hall = csv_mammal.hall;
              d.data.characteristic = csv_mammal.characteristic;
              d.data.notes = csv_mammal.notes;
              d.data.extant = csv_mammal.extant;
              d.data.population = csv_mammal.population;
              break;
            }
          }
        }
      )
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (innerRadius + 4) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) {return d.data.common || d.data.name;})
      .on("click", function(d){

        $("#mammal-card").show()
        var convS;
        var hall;
        var science;

        if (d.data.conservation == "VU") {
          convS = "Vulnerable";
        } else if (d.data.conservation == "EN") {
          convS = "Endangered";
        } else if (d.data.conservation == "LC") {
          convS = "Least Concern";
        } else if (d.data.conservation == "CR") {
          convS = "Critically Endangered";
        } else if (d.data.conservation == "ET") {
          convS = "Extinct in the Wild";
        }

        science = d.data.name.replace("_", " ");

        hall = convertHallName(d.data.hall);
        

        $("#mammal-common").text(d.data.common);
        $("#mammal-science").text(science);
        $("#mammal-hall").text(hall);
        $("#mammal-conv").text("Conservation Status: "+convS);
        $("#mammal-desc").text(d.data.population);
        $("#mammal-photo").attr("src", "amnh.jpg");
      })
});

function moveToFront() {
  this.parentNode.appendChild(this);
}

function highlightMammal(elem, d, active, color) {
  d3.select(d.linkExtensionNode).classed("link-extension--active", active).each(moveToFront);
  do d3.select(d.linkNode).classed(color, active).each(moveToFront); while (d = d.parent);
}

function highlightHall(hall, color) {
  	unhighlightAll();
    var text_elem;
    for (var index in root.leaves()) {
    var datum = root.leaves()[index];
    if (datum.data.hall == hall) {
      text_elem = $("text:contains(" + datum.data.common+ ")")[0];
      highlightMammal(text_elem, datum, true, color);
    }
  }

  $("#current-hall").text(convertHallName(hall));
}

function unhighlightAll () {
  $('.label--active').removeClass('label--active');
  $('.link-extension--active').removeClass('link-extension--active');
  $('.AFRICAN-MAMMALS').removeClass('AFRICAN-MAMMALS');
  $('.BIODIVERSITY').removeClass('BIODIVERSITY');
  $('.ASIAN-MAMMALS').removeClass('ASIAN-MAMMALS');
  $('.EXTINCT').removeClass('EXTINCT');
  $('.PRIMATES').removeClass('PRIMATES');
  $('.NYSTATE').removeClass('NYSTATE');
  $('.ORIGINS').removeClass('ORIGINS');
  $('.AMERICAN-MAMMALS').removeClass('AMERICAN-MAMMALS');
  $('.OCEAN-LIFE').removeClass('OCEAN-LIFE');
  $("#current-hall").text('');
}


// Compute the maximum cumulative length of any node in the tree.
function maxLength(d) {
  return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
}

// Set the radius of each node by recursively summing and scaling the distance from the root.
function setRadius(d, y0, k) {
  d.radius = (y0 += d.data.length) * k;
  if (d.children) d.children.forEach(function(d) { setRadius(d, y0, k); });
}

// Set the color of each node by recursively inheriting.

function linkVariable(d) {
  return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
}

function linkConstant(d) {
  return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
}

function linkExtensionVariable(d) {
  return linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);
}

function linkExtensionConstant(d) {
  return linkStep(d.target.x, d.target.y, d.target.x, innerRadius);
}

// Like d3.svg.diagonal.radial, but with square corners.
function linkStep(startAngle, startRadius, endAngle, endRadius) {
  var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
      s0 = Math.sin(startAngle),
      c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
      s1 = Math.sin(endAngle);
  return "M" + startRadius * c0 + "," + startRadius * s0
      + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
      + "L" + endRadius * c1 + "," + endRadius * s1;
}

function displayConservation(){
  $("#legend").toggle();
  for (var index in mammal_details) {
    var mammal = mammal_details[index];
      if (mammal.conservation != "LC"){
        //turning on and off conservation status
        var htmlelement= $("text:contains(" + mammal.common +")");
        if (htmlelement.attr("class") == undefined || htmlelement.attr("class") == ""){
          htmlelement.addClass(mammal.conservation);
        }
        else{
          htmlelement.removeClass(mammal.conservation);
        }
    }
  }
};
    

