const credits = {
  text : "Created By HiC Browser",
  href : ""
};
/**
 * 
 * @param {*} _id container id
 * @param {*} config {
 * id:"",
 * title: "",
 * subtitle:"",
 * categories:[],
 * name1:"",
 * name2:"",
 * data1:[],
 * data2:[]
 * }
 */
export function create2bar(config){
  let categories1 = config.categories1;
  let categories2 = config.categories2;
  let colors = parent.getChartColors();
  Highcharts.chart(config.id, {
    chart: {
      type: 'bar',
      backgroundColor: null
     },
    navigation: {
      buttonOptions: {
        enabled: true
      }
    },
    plotOptions:{
      series:{
        cursor: 'pointer',
        dataLabels:{
          enabled:true,
          format:'{y}',
        },
        events:{
          click:function(event){
            show2DDetail('2bar', this.name, event.point.category,  event.point.options)
          }
        }
      }
    },
    credits:credits,
    colorAxis: [{
        layout:'horizontal',
        maxColor: colors[0],
        minColor: colors[1],
        reversed: true
    }, {
        layout:'horizontal',
        minColor: colors[2],
        maxColor: colors[3],
    }],
     title: {
         text: config.title
     },
     subtitle: {
         text: config.subtitle
     },
     xAxis: [{
        categories: categories1,
        reversed: true,
        labels: {
          step: 1
        }
     }, {
         opposite: true,
         reversed: false,
         categories: categories2,
         linkedTo: 0,
         labels: {
             step: 1
         }
     }],
     yAxis: [{
         title: {
             text: null
         },
     gridLineWidth:0,
         reversed: true,
         width: '50%'
     }, {
         title: {
             text: null
         },
     gridLineWidth:0,
         left: '50%',
         offset: 0,
         showFirstLabel: false,
         width: '50%'
     }],
     series: [{
         name: config.name1,
         data: config.data1
     }, {
         name: config.name2,
         colorAxis: 1,
         data: config.data2,
         yAxis: 1
     }]
  });

}



export function createDrilldown(config){
  let categories = config.categories;
  let chart = Highcharts.chart(config.id,{
    chart: {
      type: 'pie',
    },
    colors:parent.getChartColors(),
    credits:credits,
    title: {
      text: config.title
    },
    subtitle: {
      text: config.subtitle
    },
    xAxis:{
      'categories': categories
    },
    yAxis:{
      title:{
        text:null
      },
      gridLineWidth:0
    },
    legend:{
      enabled:true
    },
    plotOptions: {
      series: {
        cursor:'pointer',
        dataLabels: {
          enabled: true,
          format: '{point.name}: {point.y:.2f}%'
        }
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
    },
    series: [{
      name: config.name1,
      colorByPoint: true,
      data: config.data1
    }],
    drilldown: {
      series: config.data2,
    }
  });
}

export function createBoxPlot(config){
  let categories = config.categories;
  Highcharts.chart(config.id, {
    chart: {
      type: 'boxplot'
    },
    credits:credits,
    title: {
      text: config.title
    },
    legend: {
      enabled: false
    },
    xAxis: {
      categories: categories,
      title: {
        text: null
      }
    },
    yAxis: {
      title: {
        text: null
      }
    },
    tooltip:{

      enabled:true
    },
    plotOptions: {
      series: {
        cursor:'pointer',
        events:{
          click:function(event){
            show2DDetail('box', this.name, event.point.category, event.point.options)
          }
        },
      },
      boxplot: {
        fillColor: '#F0F0E0',
        lineWidth: 2,
        medianColor: '#0C5DA5',
        medianWidth: 3,
        stemColor: '#A63400',
        stemDashStyle: 'dot',
        stemWidth: 1,
        whiskerColor: '#3D9200',
        whiskerLength: '20%',
        whiskerWidth: 3
      }
    },
    series: [{
      name: config.name,
      data: config.data
    }]
  });
}

export function createColumn(config){
  let categories = config.categories;
  let chart = Highcharts.chart(config.id, {
    chart: {
      type: 'column'
    },
    colors:parent.getChartColors(),
    credits:credits,
    title: {
      text: config.title
    },
    subtitle: {
      text: config.subtitle
    },
    xAxis: {
      'categories': categories
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Value'
      }
    },
    legend: {
      enabled: true
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>'
    },
    plotOptions: {
      series: {
        cursor:'pointer',
        events:{
          click:function(event){
            show2DDetail('column', this.name, event.point.category, event.point.options)
          }
        }
      }
    },
    series: [{
      colorByPoint:true,
      name: config.name,
      data:config.data,
      dataLabels: {
        enabled: true,
        color: '#FFFFFF',
        align: 'center',
        format: '{point.y}'
      }
    }]
  });
}

export function createStkColumn(config){
  let categories = config.categories;
  let chart = Highcharts.chart(config.id, {
    chart: {
      type: 'column'
    },
    colors :parent.getChartColors(),
    title: {
      text: config.title
    },
    credits:credits,
    xAxis: {
      categories: categories
    },
    yAxis: {
      max: 1,
      title: {
        text: "The percentage"
      }
    },
    legend: {
      align: 'center',
      x: 0,
      verticalAlign: 'top',
      y: 25,
      floating: true,
      backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.x + '</b><br/>' +
          this.series.name + ':' +  (this.y * 100).toFixed(2) + '%';
      }
    },
    plotOptions: {
      series:{
        dataLabels:{
          enabled:true,
          format:'{y:.2f}',
        },
        cursor:'pointer',
        events:{
          click:function(event){
            show2DDetail('stkcolumn', this.name, event.point.category, event.point.options)
          }
        }
      },
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
        }
      }
    },
    series: 
    [{
      name: 'A',
      data: config.data1
    }, {
      name: 'B',
      data: config.data2
    }]
  });
}