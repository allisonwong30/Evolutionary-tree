

var mammals_csv; 
d3.csv("HallMammalConservation.csv", function(data) {
  mammals_csv = data;
  for (var index in mammals_csv) {
  var mammal = mammals_csv[index];
  if (mammal.conservation == "NT") {return "red";}
  else {return "black";}
  

}
})


//making a circle area/box for the tree


var outerRadius = 940 / 2,
    innerRadius = outerRadius - 170;

var cluster = d3.cluster()
    .size([360, innerRadius])
    .separation(function(a, b) { return 1; });

var svg = d3.select("#tree").append("svg")
    .attr("width", outerRadius * 2)
    .attr("height", outerRadius * 2);


var treeviz = svg.append("g")
    .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

//using newick file

d3.text("mammals_newick.txt", function(error, life) {
  if (error) throw error;

//creating tree
  var root = d3.hierarchy(parseNewick(life), function(d) { return d.branchset; })
      .sum(function(d) { return d.branchset ? 0 : 1; })
      .sort(function(a, b) { return (a.value - b.value) || d3.ascending(a.data.length, b.data.length); });

  cluster(root);

  setRadius(root, root.data.length = 0, innerRadius / maxLength(root));


  var linkExtension = treeviz.append("g")
      .attr("class", "link-extensions")
    .selectAll("path")
    .data(root.links().filter(function(d) { return !d.target.children; }))
    .enter().append("path")
      .each(function(d) { d.target.linkExtensionNode = this; })
      .attr("d", linkExtensionConstant);

  var text = treeviz.append("g")
      .attr("class", "links")
    .selectAll("path")
    .data(root.links())
    .enter().append("path")
      .each(function(d) { d.target.linkNode = this; })
      .attr("d", linkConstant)
      .attr("stroke", function(d) { return d.target.color; });

  treeviz.append("g")
      .attr("class", "labels")
    .selectAll("text")
    .data(root.leaves())
    .enter().append("text")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (innerRadius + 4) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { 
        var sci_name = d.data.name.replace(/_/g, " ");

        var common_name = convert(sci_name);

        d.data.common = common_name;
        return common_name; 
      })
      .on("mouseover", mouseovered(true)) //detecting mouse
      .on("mouseout", mouseovered(false))
      .on("click", function(d){
        displayMammalCard(d.data.common);
      });
	

  function changed() {
    clearTimeout(timeout);
    var t = d3.transition().duration(750);
    linkExtension.transition(t).attr("d", this.checked ? linkExtensionVariable : linkExtensionConstant);
    link.transition(t).attr("d", this.checked ? linkVariable : linkConstant);
  }

  function mouseovered(active) {
    return function(d) {
      d3.select(this).classed("label--active", active);
      d3.select(d.linkExtensionNode).classed("link-extension--active", active).each(moveToFront);
      do d3.select(d.linkNode).classed("link--active", active).each(moveToFront); while (d = d.parent);
    };
  }

  function moveToFront() {
    this.parentNode.appendChild(this);
  }
});

function maxLength(d) {
 return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
}


// Set the radius of each node by recursively summing and scaling the distance from the root.
function setRadius(d, y0, k) {
  d.radius = (y0 += d.data.length) * k;
  if (d.children) d.children.forEach(function(d) { setRadius(d, y0, k); });
}


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





function convert(sci_name) {
   for (var index in mammals_csv) {
      var mammal = mammals_csv[index];
      if (mammal.scientific == sci_name){
        return mammal.common;
      }
   }
 };




 function displayConservation(){
  $("#legend").show();
  for (var index in mammals_csv) {
      var mammal = mammals_csv[index];
      if (mammal.conservation != "LC"){
        
        var htmlelement= $("text:contains(" + mammal.common +")");
        htmlelement.addClass(mammal.conservation);
        

      }

   }
 };

 function displayMammalCard(mammal_name){
  console.log("Clicked an animal, this was it's name");
  console.log(mammal_name);
  for (var index in mammals_csv) {
      var mammal = mammals_csv[index];
      if (mammal.common == mammal_name){
        console.log("found a mammal in csv with that name");
        console.log(mammal);

        $("#mammal_name").text(mammal.common);
        $("#mammal_sci_name").text(mammal.scientific);
        $("#mammal_hall").text(mammal.hall);
        $("#mammal_image").attr("src", "photos/" + mammal.common + ".jpg");
      }

   }



 
  
};

function hideConservation(){
  $("#legend").hide();
  for (var index in mammals_csv) {
      if (mammal.conservation != "LC"){
        
        var htmlelement= $("text:contains(" + mammal.common +")");
        htmlelement.addClass(mammal.conservation);
        
}
      }
    }
// $("text").click(function showCard(){
//   
// }

   

