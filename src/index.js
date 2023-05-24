import * as d3 from 'd3';
import './styles.css';

//function for determining cuts on color depending on max and min temperature of data
function colorRange(min, max, colors) {
  let cuts = colors.length;
  let increments = (max - min) / cuts;
  let lowerBound = min;
  let upperBound = min + increments;
  let output = [];

  for (let i = 0; i < cuts; i++) {
    output.push({ lowerBound: lowerBound, upperBound: upperBound, color: colors[i] });
    lowerBound += increments;
    upperBound += increments;
  }

  return output;
}

fetch('./global-temperature.json')
  .then((response) => response.json())
  .then((data) => {
    let height = 800;
    let width = 1500;
    let padding = { left: 150, bottom: 200, top: 150, right: 25 };
    let months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    let colors = [
      '#2596be',
      '#3ba1c5',
      '#51abcb',
      '#66b6d2',
      '#ffff80',
      '#ff9e4d',
      '#ff9033',
      '#ff821a',
      '#ff3600',
    ];
    let min = d3.min(data.monthlyVariance, (d) => data.baseTemperature + d.variance);
    let max = d3.max(data.monthlyVariance, (d) => data.baseTemperature + d.variance);

    let colorFill = colorRange(min, max, colors);
    console.log(colorFill);

    let xScale = d3
      .scaleLinear()
      .domain([
        d3.min(data.monthlyVariance, (d) => d.year),
        d3.max(data.monthlyVariance, (d) => d.year),
      ])
      .range([padding.left, width - padding.right]);

    let yScale = d3
      .scaleBand()
      .domain(months)
      .range([padding.top, height - padding.bottom]); //top to bottom

    let colorScale = d3
      .scaleLinear()
      .domain([1, 10])
      .range([padding.left, padding.left + colors.length * 30]);
    //changed to using an array of objects to get the color
    // let colorScale = d3
    //   .scaleLinear()
    //   .domain([
    //     d3.min(data.monthlyVariance, (d) => data.baseTemperature + d.variance),
    //     d3.max(data.monthlyVariance, (d) => data.baseTemperature + d.variance),
    //   ])
    //   .range(['blue', 'red']);

    let chart = d3
      .select('#chart-area')
      .append('svg')
      .attr('id', 'chart')
      .attr('height', height)
      .attr('width', width);

    //title
    chart
      .append('g')
      .attr('id', 'title')
      .style('transform', `translate(${width / 2}px, ${padding.top - 50}px)`)
      .append('text')
      .text('Global land-surface temperature per month over years')
      .style('text-anchor', 'middle')
      .style('font-size', '2em');
    //description
    chart
      .select('#title')
      .append('g')
      .attr('id', 'description')
      .append('text')
      .style('transform', `translate(0, 30px)`)
      .text('From 1753 to 2015: base temperature of 8.66 C')
      .style('text-anchor', 'middle');

    //axes
    let yAxis = d3.axisLeft(yScale);
    let xAxis = d3.axisBottom(xScale).tickFormat((d) => `${d}`);
    let colorLegend = d3
      .axisBottom(colorScale)
      .tickFormat((d) => (1.684 + (d - 1) * 1.356).toFixed(2));
    //y-axis
    chart
      .append('g')
      .attr('id', 'y-axis')
      .attr('transform', `translate(${padding.left}, 0)`)
      .call(yAxis);
    chart
      .append('g')
      .attr('id', 'y-axis-label')
      .append('text')
      .attr('transform', `translate(${padding.left - 100}, ${height / 2}) rotate(-90)`)
      .style('text-anchor', 'middle')
      .text('Month')
      .style('font-size', '1.5em');
    //x-axis
    chart
      .append('g')
      .attr('id', 'x-axis')
      .attr('transform', `translate(0, ${height - padding.bottom})`)
      .call(xAxis);
    chart
      .append('g')
      .attr('id', 'x-axis-label')
      .append('text')
      .text('Year')
      .attr('transform', `translate(${width / 2}, ${height - padding.bottom + 80})`)
      .style('text-anchor', 'middle')
      .style('font-size', '1.5em');
    //color legend
    let legend = chart
      .append('g')
      .attr('id', 'legend')
      .attr('transform', `translate(0, ${height - padding.bottom + 100})`);
    legend
      .selectAll('rect')
      .data(colors)
      .enter()
      .append('rect')
      .attr('height', '30')
      .attr('width', '30')
      .style('fill', (d) => d)
      .style('transform', (d) => `translate(${padding.left + colors.indexOf(d) * 30}px, -30px)`)
      .style('stroke', 'black');
    legend.append('g').call(colorLegend); //scale with tickmarks

    //chart plot area
    chart
      .append('g')
      .attr('id', 'plot-area')
      .selectAll('rect')
      .data(data.monthlyVariance)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('data-month', (d) => d.month - 1)
      .attr('data-year', (d) => d.year)
      .attr('data-temp', (d) => data.baseTemperature + d.monthlyVariance)
      .attr('date', (d) => `${months[d.month - 1]} ${d.year}`)
      .attr('x', (d) => xScale(d.year))
      .attr('y', (d) => yScale(months[d.month - 1]))
      .attr('height', yScale('February') - yScale('January'))
      .attr('width', xScale(2000) - xScale(1999))
      .style(
        'fill',
        //find the color in the color fill array based on upper and lower bound and the temperature for the data
        (d) =>
          colorFill.find((elem) => {
            let temp = data.baseTemperature + d.variance;
            if (temp == min) {
              return elem.lowerBound == temp;
            } else {
              return temp > elem.lowerBound && temp <= elem.upperBound;
            }
          }).color,
      )
      .on('mouseenter', function (e) {
        let dataPoint = d3.select(this).data()[0];
        d3.select(this).style('stroke', 'black').style('stroke-width', '2');
        d3.select('body')
          .append('div')
          .attr('id', 'tooltip')
          .attr('data-year', dataPoint.year)
          .style('top', e.pageY + 'px')
          .style('left', e.pageX + 'px')
          .style('transform', 'translate(-50%, -100%) translateY(-20px)')
          .html(
            `${dataPoint.year} | ${months[dataPoint.month - 1]} <br>Temperature: ${(
              data.baseTemperature + dataPoint.variance
            ).toFixed(1)} C <br> Variance: ${
              dataPoint.variance > 0
                ? '+' + dataPoint.variance.toFixed(1)
                : dataPoint.variance.toFixed(1)
            }`,
          );
      })
      .on('mousemove', function (e) {
        d3.select('#tooltip')
          .style('top', e.pageY + 'px')
          .style('left', e.pageX + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this).style('stroke', 'none');
        d3.select('#tooltip').remove();
      });
  });
