# angular-d3map

Angular directive to represent dynamic data on top of a map. Inspired by http://stat4701-edav-d3.github.io/viz/cities/cities.html

Installation:
```
bower install angular-d3map
```

Usage:
```
<d3map map_data="<topojson-filename OR topojson-data>"
   point_data="<json-filename OR json-data>"
   options="about.options">
</d3map>
```
If a filename is passed, d3 will load the data inside the directive which is much faster.
