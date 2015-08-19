# angular-d3map

Angular directive to represent dynamic data on top of a map. Inspired by http://stat4701-edav-d3.github.io/viz/cities/cities.html

### Installation:
```
bower install angular-d3map
```

### Usage:
```
<d3map map_data="<topojson-filename OR topojson-data>"
   point_data="<json-filename OR json-data>"
   options="options">
</d3map>
```
If a filename is passed, d3 will load the data inside the directive which is much faster.

### Install example:
Clone repository and install dependencies:
```
npm install
bower install
```
Run the example:
```
gulp serve
```

### Data format:

For topojson see https://github.com/mbostock/topojson

The point data looks as follows:
```
{
  "range": {
    "min": 1,
    "max": 5
  },
  "labels":{
    "1": "SEP 2003",
    "2": "OCT 2003",
    "3": "NOV 2003",
    "4": "DEZ 2003",
    "5": "JAN 2004"
  },
  "points": [
    {
      "name": "A sunny place",
      "lat": 46.58501,
      "lon": 6.658924,
      "values": {
        "1": 407,
        "2": 1855,
        "3": 6739,
        "4": 39081,
        "5": 13546
      }
    },
    {
      "name": "A hilly place",
      "lat": 46.49397,
      "lon": 9.889431,
      "values": {
        "2": 6912,
        "3": 11325,
        "4": 12324
      }
    }
  ]
}
```

Currently available options are:
```
var options = {
  width: 960,
  height: 600,
  projection: 'mercator',
  scale: 9500,
  center_lat: 46.801111,
  center_lon: 8.226667,
  slider: true, // show slider (true/false)
  slider_pos: 'top', // slider position ('top'/'bottom')
  frame_length: 500,
  legend: true // show legend (true/false)
};
```
