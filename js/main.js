let tooltip, scatterPlot, lineChart;

let plotStroke = { 'Marvel': '#f71a05', 'DC': '#525151'}
let plotFill = { 'Marvel': '#faa59d', 'DC': '#a9abaa'}
let themeMapping = { 'light':'background: #F6F8F9; color: #15202B;', 'dark': 'background: #15202B; color: #F6F8F9;' }
let imageMapping = { 'light':"./images/sun_icon.png", 'dark': "./images/moon_icon.png" }
let themeTextFillMapping = { 'light': '#15202B', 'dark': '#F6F8F9'}
let themeBgFillMapping = { 'light': '#F6F8F9', 'dark': '#15202B'}

let plotData = [];

var margin = { top: 10, right: 30, bottom: 30, left: 60 },
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

let maxSize = 600;

let htmlElement = document.querySelector('html')
let color;
let currentTheme;

function getcurrentTheme() {
  return localStorage.getItem('theme') || 'light'
}

function switchTheme(e) {
  if (e.target.checked) {
    htmlElement.setAttribute('style', themeMapping['dark'])
    localStorage.setItem('theme', 'dark');
    document.getElementById("themeIcon").src = "./images/moon_icon.png";
    document.querySelectorAll(`[id^="d_text"]`).forEach(element => {
      element.setAttribute('style', 'fill:' + themeTextFillMapping['dark'])
    }); 
    document.getElementById('kaggleLink').setAttribute('style', 'color:' + themeTextFillMapping['dark'])
  }
  else { 
    htmlElement.setAttribute('style', themeMapping['light'])
    localStorage.setItem('theme', 'light');
    document.getElementById("themeIcon").src = "./images/sun_icon.png"; 
    document.querySelectorAll(`[id^="d_text"]`).forEach(element => {
      element.setAttribute('style', 'fill:' + themeTextFillMapping['light'])
    });
    document.getElementById('kaggleLink').setAttribute('style', 'color:' + themeTextFillMapping['light'])
  }    
}

document.addEventListener('DOMContentLoaded', function() {

  let toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
  currentTheme = getcurrentTheme()

  lineChart = d3.select("#dceu").append('g')
                .attr("transform","translate(" + ((maxSize - width)/2 - 40) + "," + (maxSize - height)/2 + ")")
                .style('fill', themeBgFillMapping[currentTheme]);

  scatterPlot = d3.select("#mcu")
                  .append('g')
                  .attr("transform","translate(" + (maxSize - width)/2 + "," + (maxSize - height)/2 + ")")
                  .style('fill', themeBgFillMapping[currentTheme]);

  tooltip = d3.select("body")
          .append("div")
          .attr("id", "d_tooltip")
          .style("opacity", 0)
          .style('background', themeBgFillMapping[currentTheme]);

  if (currentTheme) {
      htmlElement.setAttribute('style', themeMapping[currentTheme])
      document.getElementById("themeIcon").src = imageMapping[currentTheme]
      document.querySelectorAll(`[id^="d_text"]`).forEach(element => {
        element.setAttribute('style', 'fill:' + themeTextFillMapping[currentTheme])
      });
      document.getElementById('kaggleLink').setAttribute('style', 'color:' + themeTextFillMapping[currentTheme])

      if (currentTheme === 'dark') {
          toggleSwitch.checked = true;
      }
  }
  toggleSwitch.addEventListener('change', switchTheme, false);

  Promise.all([d3.csv('data/data.csv')])
    .then(function(value) {
        value[0].forEach((element) => {
            var [month, day, year] = element['Release'].split('-');
            plotData.push({
                "movie_name": element["Original Title"],
                "date": new Date(+year, +month - 1, +day),
                "studio": element["Company"],
                "budget": parseInt(element["Budget"]),
                "imdb": element["Rate"],
                "metascore": element["Metascore"],
                "gross": parseInt(element["Gross Worldwide"])
            })
        });
        drawScatter(plotData)
        drawLine(plotData)
    });
});

function numberFormat(d) {
  return `$${parseFloat((d/1e6).toFixed(2))}M`;
}

function drawScatter(data) {
  var x = d3.scaleLinear()
            .range([ 0, width ])

  x.domain([0, 1.1*d3.max(data, function(d) { return +d['budget'] })])

  scatterPlot.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(10).tickFormat(numberFormat));

  var y = d3.scaleLinear()
    .range([ height, 0])
    .domain([0, 1.1*d3.max(data, function(d) { return +d['gross'] })])

  scatterPlot.append("g")
    .call(d3.axisLeft(y).ticks(10).tickFormat(numberFormat));

  let sp = scatterPlot
    .selectAll(".dot")
    .data(data)
    .join("circle")
    .attr("class", "dot2")
    .attr("cx", function (d) { return x(d.budget); } )
    .attr("cy", function (d) { return y(d.gross); } )
    .attr("r", function (d) { return d.metascore/10 })
    .style("fill", function(d){ return plotFill[d.studio] })
    .style("stroke", function (d) { return plotStroke[d.studio] })
    .style("opacity", 0.5)

  sp  
    .on('mouseover', function(event, d) {
      tooltip.transition()
        .duration(50)
        .attr('class', 'tooltip')
        .style("opacity", 1)
        .style('background', themeBgFillMapping[getcurrentTheme()])
        .style('fill', themeTextFillMapping[getcurrentTheme()]);
      
        tooltip.html(`Movie: ${d.movie_name}</br> Metascore: ${d.metascore}</br> Budget: ${numberFormat(d.budget)}</br> Overall Gross: ${numberFormat(d.gross)}`)
        .style("left", (event.pageX) + 10 + "px")
        .style("top", (event.pageY) + 10 + "px")
        .style("font-family", 'Garamond');

      d3.selectAll(".dot2").filter(function(e, j){
          return d.movie_name === e.movie_name
        }).style("opacity", "1")
    })
    .on('mousemove',function(event, d) {
      tooltip
        .style("left", (event.pageX) + 10 + "px")
        .style("top", (event.pageY) + 10 + "px");
    })
    .on('mouseout', function(event, d) {
      d3.selectAll(".dot2").filter(function(e, j){
        return d.movie_name === e.movie_name
      }).style("opacity", 0.5).raise()

      tooltip.transition()
        .attr('class', 'tooltip')
        .duration(50)
        .style("opacity", 0);
    });

    scatterPlot.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left)
      .attr("x", -height/2)
      .attr("font-weight",700)
      .attr("font-family", "Garamond")
      .attr("font-size", "20px")
      .attr("id", "d_text1")
      .style("fill", themeTextFillMapping[currentTheme])
      .text("Overall Gross - Millions in USD")

    scatterPlot.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width/2)
      .attr("y", height + margin.top + 35)
      .attr("font-weight",700)
      .attr("id", "d_text2")
      .style("fill", themeTextFillMapping[currentTheme])
      .attr("font-family", "Garamond")
      .attr("font-size", "20px")
      .text("Budget of the movies - Millions in USD")

    scatterPlot.append("rect")
      .attr("x", width - 10)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", '#faa59d')
      .style("stroke", plotStroke['Marvel'])

    scatterPlot.append("text")
      .attr("x", width + 10)
      .attr("y", 12)
      .attr("font-family", "Garamond")
      .attr("font-size", "15px")
      .attr("id", "d_text3")
      .style("fill", themeTextFillMapping[currentTheme])
      .text("MCU Movies")

    scatterPlot.append("rect")
      .attr("x", width - 10)
      .attr("y", 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", '#a9abaa')
      .style("stroke", plotStroke['DC'])

    scatterPlot.append("text")
      .attr("x", width + 10)
      .attr("y", 37)
      .attr("font-family", "Garamond")
      .attr("font-size", "15px")
      .attr("id", "d_text4")
      .style("fill", themeTextFillMapping[currentTheme])
      .text("DCEU Movies");
}

function drawLine(data){
  var newData = [{id: 'Marvel', items: []}, {id: 'DC', items: []}]
  data.forEach((element) => {
    if(element['studio'] == 'Marvel') {
      newData[0].items.push(element)
    }
    else {
      newData[1].items.push(element)
    }
  })

  var x = d3.scaleTime()
            .range([ 0, width+80 ]);

  x.domain([new Date(d3.min(data, function(d) { return +d['date'].getFullYear() }) - 1, 0, 1), new Date(d3.max(data, function(d) { return +d['date'].getFullYear() }) + 1,1, 1)]);

  var xAxis = lineChart.append("g")
                       .attr("transform", "translate(0," + height + ")")
  xAxis.transition().call(d3.axisBottom(x).ticks(d3.timeYear.every(1))).attr("class", "xAxis1");

  var y = d3.scaleLinear()
            .range([height, 0]);
  y.domain([d3.min(data, function(d) { return +d['imdb'] }) - 1, 1.05*d3.max(data, function(d) { return +d['imdb'] })]);
  var yAxis = lineChart.append("g")
                       .attr("class", "myYaxis")
  yAxis.transition().duration(250).call(d3.axisLeft(y)).attr("class", "yAxis2");

  var lines = lineChart.selectAll('.line')
  .data(newData)
  .join("path")
  .attr("class", "line")
  .style('fill','none')
  .attr("id",  d => d.studio)
  .attr('stroke', function (d) { 
    return plotFill[d.id] 
  })

  var singleLine = d3.line()
                    .x(d => x(d.date))
                    .y(d => y(d.imdb))
                    .curve(d3.curveCardinal);

  lines
  .transition()
  .ease(d3.easeSin)
  .duration(500)
  .attr('d', d => singleLine(d.items))
  .style('stroke-width','3')
  .style('opacity','0.95')


  lines  
    .on('mouseover', function(d, i) {
      d3.selectAll(".line").filter(function(e, j){
          return e.id === i.id
      }).style("stroke", plotStroke[i.id])
    })
    .on('mousemove',function(event, d) {
      tooltip
        .style("left", (event.pageX) + 10 + "px")
        .style("top", (event.pageY) + 10 + "px");
     })
    .on('mouseout', function(d, i) {
      d3.selectAll(".line").filter(function(e, j){
        return e.id === i.id
      }).style("stroke", plotFill[i.id])
    });

  lineChart.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height/2 + 10)
    .attr("font-weight",700)
    .attr("font-family", "Garamond")
    .attr("font-size", "20px")
    .attr("id", "d_text5")
    .style("fill", themeTextFillMapping[currentTheme])
    .text("IMDB Score")

  lineChart.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width/2 + 20)
    .attr("y", height + margin.top + 45)
    .attr("font-weight",700)
    .attr("font-family", "Garamond")
    .attr("font-size", "20px")
    .attr("id", "d_text6")
    .style("fill", themeTextFillMapping[currentTheme])
    .text("Year")

  lineChart.append("rect")
    .attr("x", width + 5)
    .attr("y", height - 100)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", '#faa59d')
    .style("stroke", plotStroke['Marvel'])

  lineChart.append("text")
    .attr("x", width + 25)
    .attr("y", height - 88)
    .attr("font-family", "Garamond")
    .attr("font-size", "15px")
    .attr("id", "d_text7")
    .style("fill", themeTextFillMapping[currentTheme])
    .text("MCU Movies")

  lineChart.append("rect")
    .attr("x", width +5)
    .attr("y", height - 75)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", '#a9abaa')
    .style("stroke", plotStroke['DC'])

  lineChart.append("text")
    .attr("x", width + 25)
    .attr("y", height - 63)
    .attr("font-family", "Garamond")
    .attr("font-size", "15px")
    .attr("id", "d_text8")
    .style("fill", themeTextFillMapping[currentTheme])
    .text("DCEU Movies");

  lineChart.append('line')
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", width + 80)
    .attr("y2", 0)
    .attr("transform", "translate(0," + 10 + ")");

  lineChart.append('line')
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", width + 80)
    .attr("y2", 0)
    .attr("transform", "translate(0," + 73 + ")");

  lineChart.append("rect")
    .attr("x", 0)
    .attr("y", 10)
    .attr("width", width + 80)
    .attr("height", 63)
    .style("fill-opacity", 0.5)
    .style("fill", "#7fb8ba")

  var sp = lineChart.selectAll(".dot")
    .data(newData[0].items.concat(newData[1].items))
    .join("circle")
    .attr("class","dot")
      .attr("fill", function (d) { 
        return plotStroke[d.studio] 
      })
      .attr("stroke", "none")
      .attr("cx", function(d, i) { 
        return x(d.date)
      })
      .attr("cy", function(d, i) {
        return y(d.imdb)
      })
      .attr("r", 4)
      .style('opacity','1')

  sp  
    .on('mouseover', function(event, d) {
      tooltip.transition()
        .duration(50)
        .attr('class', 'tooltip')
        .style("opacity", 1)
        .style('background', themeBgFillMapping[getcurrentTheme()])
        .style('fill', themeTextFillMapping[getcurrentTheme()]);
      
      tooltip.html(`Movie: ${d.movie_name}</br>IMDB: ${d.imdb}</br>Budget: ${numberFormat(d.budget)}</br>Overall Gross: ${numberFormat(d.gross)}`)
        .style("left", (event.pageX) + 10 + "px")
        .style("top", (event.pageY) + 10 + "px")

      d3.selectAll(".dot").filter(function(e, j){
          return d.movie_name === e.movie_name
        }).style("opacity", "1")
    })
    .on('mousemove',function(event, d) {
      tooltip
        .style("left", (event.pageX) + 10 + "px")
        .style("top", (event.pageY) + 10 + "px");
    })
    .on('mouseout', function(event, d) {
      d3.selectAll(".dot").filter(function(e, j){
        return d.movie_name === e.movie_name
      }).style("opacity", 1).raise()

      tooltip.transition()
        .attr('class', 'tooltip')
        .duration(50)
        .style("opacity", 0);
    });
}




