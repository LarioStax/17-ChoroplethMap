const URL_COUNTY = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";
const URL_EDUCATION = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
let promises = [];

function addJsonReqPromise(url) {
	promises.push(d3.json(url))
}
addJsonReqPromise(URL_COUNTY);
addJsonReqPromise(URL_EDUCATION);


Promise.all(promises).then(drawGraph)

function drawGraph(data) {
	let dataEducation = data[1];
	let geoData = data[0];

	const width = 950;
	const height = 600;

	let eduMin = d3.min(dataEducation.map( (d) => d.bachelorsOrHigher))
	let eduMax = d3.max(dataEducation.map( (d) => d.bachelorsOrHigher));

	let colors = d3.schemeBlues[7];
	let colorScale = d3.scaleThreshold()
		.domain(d3.range(eduMin, eduMax, (eduMax-eduMin)/7))
		.range(colors);

	function getCountyByFips(fips) {
		var county = dataEducation.find( (county) => county.fips === fips);
		return county;
	}

	let section = d3.select("body")
		.append("section")

	// HEADER START
	let heading = d3.select("section")
		.append("heading")

	heading
		.append("h1")
			.attr("id", "title")
			.text("United States Educational Attainment")

	heading
		.append("h2")
			.attr("id", "description")
			.text("Percentage of adults age 25 and older with at least a bachelor's degree (2010-2014)")
	// HEADER END

	let svg = section
		.append("svg")
			.attr("width", width)
			.attr("height", height)

	//DRAWING COUNTIES
	let geojson = topojson.feature(geoData, geoData.objects.counties)

	let path = d3.geoPath();

	svg.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("class", "county")
			.attr("fill", (d) => colorScale(getCountyByFips(d.id).bachelorsOrHigher))
			.attr("data-fips", (d) => d.id)
			.attr("data-education", (d) => getCountyByFips(d.id).bachelorsOrHigher)
			.on("mouseover", handleMouseOver)
			.on("mosemove", handleMouseMove)
			.on("mouseout", handleMouseOut)

	//DRAWING BORDERS
  let borders = svg.append("path")
	  	.classed("stateBorder", true)
	  	.attr("fill", "none")
	  	.attr("stroke", "black")
    .datum(topojson.mesh(geoData, geoData.objects.states), (a, b) => a !== b)
    	.attr('d', path)

	//TOOLTIP
	let tooltip = d3.select("body")
		.append("div")
			.style("opacity", 0)
			.attr("id", "tooltip")
			.style("position", "absolute")
			.style("background-color", `${colors[6]}`)
			.style("color", "white")
			.style("padding", "10px")
			.style("text-align", "center")
			.style("border-radius", "10%")

	function handleMouseOver(el) {
		let county = getCountyByFips(el.id);
		tooltip
				.transition()
				.style("opacity", 0.8)
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
				.attr("data-education", `${county.bachelorsOrHigher}`)
				.html(
					`${county["area_name"]}, 
					${county.state}: 
					${county.bachelorsOrHigher}%`
				)
		d3.select(this)
				.style("opacity", 0.1)
	}

	function handleMouseOut(el) {
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px") //solves a bug (bug? or feature? :-$ ) if you go to an element under where tooltip used to be, it wouldn't open a new one
				.style("top", "-1000px") //thinks it's still in the (now invisible) tooltip, so the mouseover doesn't activate, this moves it out of the way
		d3.select(this)
				.style("opacity", 1)
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}
	// END TOOLTIP

	// START LEGEND
	const legendWidth = 200;
	const legendHeight = 10;
	const legendBarLength = legendWidth / colors.length

	let legend = svg
		.append("g")
			.attr("id", "legend")

	let legendScale = d3.scaleLinear()
		.domain([eduMin, eduMax])
		.rangeRound([0, legendWidth])

	let legendAxis = d3.axisBottom(legendScale)
			.tickSize(13)
			.tickSizeOuter(0)
		  .tickFormat(x => `${Math.round(x)}%`)
		  .tickValues(colorScale.domain());

	let colorRange = colorScale
		.range()
	  .map(d => {
	    let inverted = colorScale.invertExtent(d);
	    if (inverted[0] === undefined) {inverted[0] = legendScale.domain()[0];}
	    if (inverted[1] === undefined) {inverted[1] = legendScale.domain()[1];}
	    return inverted;
			});


	let legendColors = legend
		.selectAll("rect")
		.data(colorRange)
		.enter()
		.append("rect")
			.attr("transform", `translate(${width*0.65},40)`)
			.attr("height", 10)
			.attr("width", legendBarLength)
			.attr("x", (d,i) => i*legendBarLength)
			.attr("fill", (d) => colorScale(d[0]))

	function removeLegendDomain(el) {
		el.select(".domain").remove()
	}

	let legendTicks = legend.append("g")
			.attr("id", "legendAxis")
			.attr("transform", `translate(${width*0.65},40)`)
		.call(legendAxis)
		.call(removeLegendDomain)

	// END DAMN LEGEND..
	}