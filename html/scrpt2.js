const data = [
    {
      label: 'Office Supplies',
      spending: 460,
    },
    {
      label: 'Transportation',
      spending: 95,
    },
    {
      label: 'Business Services',
      spending: 300,
    },
    {
      label: 'Restaurant',
      spending: 400,
    },
    {
      label: 'Entertainment',
      spending: 220,
    },
    {
      label: 'Travel',
      spending: 1000,
    },
    {
      label: 'Other',
      spending: 125,
    },
  ];
  
  const colors = [ '#FFCA19', '#FF7142', '#57B54E', '#1AB4D4', '#4EDDCE', '#B577CE', '#CBF39A']
  
  const width = 571,
    chartWidth = 189,
    chartHeight = 189,
    height = 378,
    radius = Math.min(chartWidth, chartHeight) / 2,
    innerRadius = radius - radius + 50;
  
  const formatter = d3.format('$,');
  
  const svg = d3.select('#donut-chart')
    .attr('width', width)
    .attr('height', height);
  
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius);
  
  const pie = d3.pie().value(d => d.spending)
  
  const arcGroup = svg
    .append('g')
    .attr('transform', `translate(${chartWidth / 2},${chartHeight / 2})`)
    .attr('class', 'arc-group');
  
  arcGroup
    .selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc-group')
    .append('path')
    .attr('class', 'arc')
    .attr('tabindex', 0)
    .attr('d', arc)
    .attr('fill', (d, i) => colors[i])
    .attr('aria-describedby', (d,i) => `tooltip-${i}`)
    .on('mousemove', (d,i) => {
      const {clientX, clientY} = d3.event
      d3.select(`#tooltip-${i}`)
        .attr('transform', `translate(${clientX} ${clientY})`)
    })
    .on('mouseenter', (d, i) => {
      d3.select(`#tooltip-${i}`).append('text')
        .text(`${d.data.label} - $${d.data.spending}`)
    })
    .on('focus', function(d,i) {
      d3.select(this).attr('stroke', 'black').attr('stroke-width', 2)
      const {top,right,bottom,left} = d3.event.target.getBoundingClientRect();
    
      d3.select(`#tooltip-${i}`).append('text')
        .text(`${d.data.label} - $${d.data.spending}`)
        .attr('transform', `translate(${(left + right)/2} ${(top+bottom)/2})`)
    })
    .on('mouseleave', (d,i) => d3.select(`#tooltip-${i} text`).remove())
    .on('blur', function(d, i) {
      d3.select(this).attr('stroke', null)
      d3.select(`#tooltip-${i} text`).remove()
    })
  
  const tooltipGroup = svg
    .append('g')
    .attr('class', 'tooltip')
  
  tooltipGroup
    .selectAll('.tooltip-item')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'tooltip-item')
    .attr('id', (d,i) =>`tooltip-${i}`)