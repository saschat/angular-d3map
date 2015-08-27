(function(){

  'use strict';

  angular.module('d3map', [])
    .directive('d3map', function(){
      return {
        restrict: 'E',
        scope: {
          mapData: '=',
          pointData: '=',
          options: '='
        },
        link: function postLink(scope, element, attrs){
          var defaultOptions = {
            width: 960,
            height: 600,
            projection: 'mercator',
            scale: 9500, // default 150
            centerLat: 46.801111,
            centerLon: 8.226667,
            slider: true,
            sliderPos: 'top',
            frameLength: 500,
            legend: false,
            annotate: false,
            probe: true
          };
          scope._opt = angular.extend(defaultOptions, scope.options);
          configMap();
          buildHTML();
          window.onresize = resize;

          function configMap(){
            scope.projection = d3.geo.mercator()
              .scale(scope._opt.scale)
              .center([scope._opt.centerLon, scope._opt.centerLat]);

            scope.path = d3.geo.path()
              .projection(scope.projection);
          }

          function buildHTML(){
            /*
            Structure:
            ----------
            d3mapContainer
            - sliderContainer
            -- sliderLabel
            -- sliderButton
            -- sliderBar
            - mapContainer
            -- svgCanvas
            --- legend
            --- mapGroup
            ---- map
            ---- points
            --- probe
             */
            scope.d3mapContainer = d3.select(element[0]).append('div')
              .attr('id', 'd3map-container');

            // Slider
            scope.sliderContainer = scope.d3mapContainer.append('div')
              .attr('id', 'slider-container');

            // Map
            scope.mapContainer = scope.d3mapContainer.append('div')
              .attr('id', 'map-container');
            scope.svgCanvas = scope.mapContainer.append("svg")
              .attr("width", scope._opt.width)
              .attr("height", scope._opt.height);

            scope.legend = scope.svgCanvas.append("g")
              .attr("id", "legend");

            scope.mapGroup = scope.svgCanvas.append("g")
              .attr("id", "map_group");
            scope.map = scope.mapGroup.append("g")
              .attr("id", "map");
            scope.points = scope.mapGroup.append("g")
              .attr("id", "points");

            scope.mapProbe = scope.mapContainer.append("div")
              .attr("id", "probe");
          }

          function circleSize(d){
            return Math.sqrt(.02 * Math.abs(d));
          }

          function drawMap(){
            scope.map.remove();
            scope.map = scope.mapGroup.append("g")
              .attr("id", "map");
            // country
            scope.map.append("g")
              .attr("id", "countries")
              .selectAll()
                .data(topojson.feature(scope._mapData, scope._mapData.objects.country).features)
              .enter().append("path")
                .attr("class", "country")
                .attr("d", scope.path)
                .attr("id", function(d){
                  //console.log(d.id);
                  return "id-" + d.id;
                });
            // lakes
            scope.map.append("g")
              .attr("id", "lakes")
              .selectAll()
                .data(topojson.feature(scope._mapData, scope._mapData.objects.lakes).features)
              .enter().append("path")
                .attr("class", "lake")
                .attr("d", scope.path)
                .attr("id", function(d){
                  //console.log(d.id);
                  return "id-" + d.id;
                });
            // cantons
            scope.map.append("g")
              .attr("id", "cantons")
              .selectAll()
                .data(topojson.feature(scope._mapData, scope._mapData.objects.cantons).features)
              .enter().append("path")
                .attr("class", "canton")
                .attr("d", scope.path)
                .attr("id", function(d){
                  //console.log(d.id);
                  return "id-" + d.id;
                });
                //.on("mouseover", function(d){
                //  console.log(d.id);
                //  d3.select(this).attr("class","canton-hover")
                //})
                //.on("mouseout", function(d){
                //  console.log(d.id);
                //  d3.select(this).attr("class","canton")
                //});
            // country boundries
            scope.map.append("path")
              .datum(topojson.feature(scope._mapData, scope._mapData.objects.country))
              .attr("class", "country-boundaries")
              .attr("d", scope.path);
            // canton boundries
            scope.map.append("path")
              .datum(topojson.mesh(scope._mapData, scope._mapData.objects.cantons, function(a, b){
                return a !== b;
              }))
              .attr("class", "canton-boundaries")
              .attr("d", scope.path);
          }

          function drawPoints(){
            scope.points.remove();
            scope.points = scope.mapGroup.append("g")
              .attr("id", "points");
            angular.forEach(scope._pointData.points, function(point, i){
              var projected;
              var data_obj;
              if(point.type == 'feature'){
                var feature_obj = scope.map.select('#'+point.featureClass)
                  .selectAll("path#id-"+point.featureId);
                if(feature_obj.length == 0){
                  return
                }
                projected = scope.path.centroid(feature_obj[0][0].__data__);
                //projected[0] -= 10;
                projected[1] += 14; // offset for text
                data_obj = scope.points.append("path")
                  .datum(point)
                  .attr("d", feature_obj.attr("d"))
                  .attr("class", "feature");
              }
              else{ //if(point.type == 'location')
                projected = scope.projection([point.lon, point.lat]);
                data_obj = scope.points.append("circle")
                  .datum(point)
                  .attr("cx", projected[0])
                  .attr("cy", projected[1])
                  .attr("r", 1)
                  .attr("vector-effect", "non-scaling-stroke");
              }
              // make point clickable
              if(point.link){
                data_obj.on("click", function(d){
                  window.location = d.link;
                });
              }
              // show probe
              if(scope._opt.probe){
                data_obj
                  .on("mouseover", function(d){
                    if(scope.currentFrame in d.values){
                      d3.select(this).style("opacity", 0.3)
                    }
                  })
                  .on("mousemove", function(d){
                    if(scope.currentFrame in d.values){
                      scope.mapProbeData = d;
                      setMapProbeContent();
                      scope.mapProbe
                        .style({
                          "display": "block",
                          "top": (d3.event.pageY - scope.points.property("offsetParent").offsetTop - 80) + "px",
                          "left": (d3.event.pageX - scope.points.property("offsetParent").offsetLeft + 10) + "px"
                        })
                    }
                  })
                  .on("mouseout", function(){
                    scope.mapProbeData = null;
                    scope.mapProbe.style("display", "none");
                    d3.select(this).style("opacity", null)
                  });
              }
              // annotate value
              if(scope._opt.annotate){
                var annotation = scope.points.append("g")
                  .datum(point)
                  .attr("class", "annotation")
                  .attr("transform", "translate(" + projected + ")");
                annotation.append("rect")
                  .attr("width", 0)
                  .attr("height", 0)
                  .attr("rx", 3)
                  .attr("ry", 3)
                  .attr("fill", "white")
                  .attr("stroke", "black")
                  .attr("stroke-width", 1);
                annotation.append("text")
                  .attr("font-size", "12px")
                  .attr("text-anchor", "middle")
                  .attr("x", 0) //10 if not  anchor middle
                  .attr("y", -14);
              }
            });
            // init circles to first value
            scope.currentFrame = scope._pointData.range.min;
            drawPointsForValue(false);
          }

          function createSlider(){
            if(scope._opt.slider == false){
              return;
            }
            var before = null;
            if(scope._opt.sliderPos == 'top'){
              before = '#map-container';
            }
            scope.sliderContainer.remove();
            scope.sliderContainer = scope.d3mapContainer.insert('div', before)
              .attr('id', 'slider-container');
            scope.sliderContainer
              .append('div')
              .attr('id', 'slider-label')
              .append('p')
              .attr('id', 'label-text');
            scope.sliderContainer
              .append('div')
              .attr('id', 'slider-button');
            scope.sliderContainer
              .append('div')
              .attr('id', 'slider-bar');

            scope.rangeScale = d3.scale.linear()
              .domain([scope._pointData.range.min, scope._pointData.range.max])
              .range([0, scope._opt.width - 260]);
            createSliderBar();
            configSliderButton();
            setSliderLabel();
          }

          function configSliderButton(){
            scope.isPlaying = false;
            d3.select("#slider-button")
              .attr("title", "Play animation")
              .on("click", function(){
                if(!scope.isPlaying){
                  scope.isPlaying = true;
                  d3.select(this).classed("pause", true).attr("title", "Pause animation");
                  animate();
                }
                else{
                  scope.isPlaying = false;
                  d3.select(this).classed("pause", false).attr("title", "Play animation");
                  clearInterval(scope.interval);
                }
              });
          }

          function getPointValue(data, index){
            var iStr = index.toString();
            if(typeof data.values[iStr] === 'undefined'){
              return 0;
            }
            else{
              return data.values[iStr];
            }
          }

          function drawPointsForValue(intertween){
            var index = scope.currentFrame;
            var circle = scope.points.selectAll("circle");
            if(scope._opt.annotate){
              var annotation = scope.points.selectAll(".annotation");
              annotation.each(function(d, i){
                var value = getPointValue(d, index);
                var text = d3.select(this).select("text");
                text.text(value == 0 ? "" : value);
                var box = text.node().getBBox();
                if(box.width > 0){
                  d3.select(this).select("rect")
                    .attr("x", box.x - 5)
                    .attr("y", box.y - 3)
                    .attr("width", box.width + 10)
                    .attr("height", box.height + 6);
                }
                else{
                  d3.select(this).select("rect")
                    .attr("width", 0)
                    .attr("height", 0);
                }
              });
            }

            if(intertween){
              circle
                .transition()
                .ease("linear")
                .duration(scope._opt.frameLength)
                .attr("r", function(d){
                  return circleSize(getPointValue(d, index));
                })
                .attr("class", function(d){
                  return getPointValue(d, index) - getPointValue(d, index-1) >= 0 ? "gain" : "loss";
                });
                // fill gives a smoother transition between colors
                //.style("fill", function(d){
                //  return getPointValue(d, index) - getPointValue(d, lastx) >= 0 ? "#67cfa9" : "#ef8a62";
                //});
            }
            else{
              circle
                .attr("r", function(d){
                  return circleSize(getPointValue(d, index))
                })
                .attr("class", function(d){
                  return getPointValue(d, index) - getPointValue(d, index-1) >= 0 ? "gain" : "loss";
                });
            }

            setSliderLabel();
            if(scope.mapProbeData){
              setMapProbeContent();
            }
          }

          function setSliderLabel(){
            if(scope.currentFrame && scope.slider){
              var iStr = scope.currentFrame.toString();
              var html = "<span>" + scope._pointData.labels[iStr] + "</span> ";
              scope.sliderContainer.select("#slider-label p#label-text").html(html);
            }
          }

          function animate(){
            scope.interval = setInterval(function(){
              var rmin = scope._pointData.range.min;
              var rmax = scope._pointData.range.max;

              scope.currentFrame++;
              if(scope.currentFrame == rmax + 1){
                scope.currentFrame = rmin;
              }
              scope.slider.value(scope.currentFrame);

              drawPointsForValue(true);

              if(scope.currentFrame == rmax){
                scope.isPlaying = false;
                d3.select("#slider-button").classed("pause", false).attr("title", "Play animation");
                clearInterval(scope.interval);
              }

            }, scope._opt.frameLength);
          }

          function createSliderBar(){
            scope.sliderContainer.select("#slider-bar").remove();
            var sliderBar = scope.sliderContainer.append("div")
              .attr("id", "slider-bar")
              .style("width", scope.rangeScale.range()[1] + "px");

            var val = scope.slider ? scope.slider.value() : 0;
            var sliderScale = d3.scale.linear()
              .domain([scope._pointData.range.min, scope._pointData.range.max]);

            scope.slider = d3.slider()
              .scale(sliderScale)
              .step(1)
              .on("slide", function(event, value){
                if(scope.isPlaying){
                  clearInterval(scope.interval);
                }
                scope.currentFrame = value;
                drawPointsForValue(d3.event.type != "drag");
              })
              .on("slideend", function(){
                if(scope.isPlaying){
                  animate();
                }
                //sliderBar.on("mousemove", sliderProbe)
              })
              .animate(scope._opt.frameLength)
              .value(val);

            sliderBar.call(scope.slider);
            sliderBar.select("a").on("mousemove", function(){
              d3.event.stopPropagation();
            });

            // Add an axis
            //var sliderAxis = d3.svg.axis();
            // .scale( scope.rangeScale )
            // .tickValues( scope.rangeScale.ticks(orderedColumns.length).filter(function(d,i){
            //   // ticks only for beginning of each year, plus first and last
            //   return d.getMonth() == 0 || i == 0 || i == orderedColumns.length-1;
            // }))
            // .tickFormat(function(d){
            //   // abbreviated year for most, full month/year for the ends
            //   if ( d.getMonth() == 0 ) return "'" + d.getFullYear().toString().substr(2);
            //   return months[d.getMonth()] + " " + d.getFullYear();
            // })
            // .tickSize(10)

            //d3.select("#axis").remove();

            //slider_container
            //  .append("svg")
            //  .attr("id", "axis")
            //  .attr("width", scope.rangeScale.range()[1] + sliderMargin * 2)
            //  .attr("height", 25)
            //  .append("g")
            //  .attr("transform", "translate(" + (sliderMargin + 1) + ",0)");
            //// .call(sliderAxis);

            //d3.select("#axis > g g:first-child text").attr("text-anchor", "end").style("text-anchor", "end");
            //d3.select("#axis > g g:last-of-type text").attr("text-anchor", "start").style("text-anchor", "start");
          }

          function createLegend(){
            if(scope._opt.legend == false){
              return;
            }
            var tran_leg = scope._opt.width - 180;
            scope.legend.remove();
            scope.legend = scope.svgCanvas.append("g")
              .attr("id", "legend")
              .attr("transform", "translate(" + tran_leg + ")");

            scope.legend.append("circle").attr("class", "gain").attr("r", 5).attr("cx", 5).attr("cy", 10);
            scope.legend.append("circle").attr("class", "loss").attr("r", 5).attr("cx", 5).attr("cy", 30);

            scope.legend.append("text").text("Gaining").attr("x", 15).attr("y", 13);
            scope.legend.append("text").text("Loosing").attr("x", 15).attr("y", 33);

            var sizes = [10000, 100000]; //pulled out the 250000
            for(var i=0; i < sizes.length; i++){
              scope.legend.append("circle")
                .attr("r", circleSize(sizes[i]))
                .attr("cx", 80 + circleSize(sizes[sizes.length - 1]))
                .attr("cy", 2 * circleSize(sizes[sizes.length - 1]) - circleSize(sizes[i]))
                .attr("vector-effect", "non-scaling-stroke");
              scope.legend.append("text")
                .text((sizes[i] / 1000) + "K")
                .attr("text-anchor", "middle")
                .attr("x", 80 + circleSize(sizes[sizes.length - 1]))
                .attr("y", 2 * ( circleSize(sizes[sizes.length - 1]) - circleSize(sizes[i]) ) + 5)
                .attr("dy", 13)
            }
          }

          function setMapProbeContent(){
            var val = scope.mapProbeData.values[scope.currentFrame];
            var html = "<strong>" + scope.mapProbeData.name + "</strong><br/>" +
              d3.format(",")(Math.abs(val)) + "  " + ( val < 0 ? "lost" : " count" ) + "<br/>" +
              "<span>" + scope._pointData.labels[scope.currentFrame] + "</span>";
            scope.mapProbe.html(html);
          }

          function sliderProbe(){
            var d = scope.rangeScale.invert(( d3.mouse(this)[0] ));
            // d3.select("#slider-probe")
            //   .style( "left", d3.mouse(this)[0] + sliderMargin + "px" )
            //   .style("display","block")
            //   .select("p")
            //   .html( months[d.getMonth()] + " " + d.getFullYear() )
          }

          function resize(){
            var w = scope.d3mapContainer.node().offsetWidth,
              h = window.innerHeight - 80;
            //var scale = Math.max(1, Math.min(w / scope._opt.width, h / scope._opt.height));
            //var scale = Math.min(w / scope._opt.width, h / scope._opt.height);
            var scale = w / scope._opt.width;
            //var tran_x = Math.max(0, (w - scope._opt.width)/2);
            //var tran_y = Math.max(0, (h - scope._opt.height)/2);
            var tran_leg = scope._opt.width * scale - 180;
            scope.svgCanvas
              .attr("width", scope._opt.width * scale)
              .attr("height", scope._opt.height * scale);
            //svg.attr("transform", "scale(" + scale + "," + scale + ")");

            scope.mapContainer.style("width", scope._opt.width * scale + "px");
            scope.sliderContainer.style("width", scope._opt.width * scale + "px");

            scope.mapGroup.attr('transform', 'translate(' + 0 + ' ' + 0 + ') scale(' + scale + ')');
            scope.legend.attr('transform', 'translate(' + tran_leg + ')');

            if(scope._opt.slider == true){
              scope.rangeScale.range([0, scope._opt.width * scale - 260]); // + w - scope._opt.width]);
              createSliderBar();
            }
          }

          function refreshAll(){
            configMap();
            refreshMap();
          }

          function refreshMap(){
            drawMap();
            refreshPoints()
          }

          function refreshPoints(){
            drawPoints();
            createLegend();
            createSlider();
            resize();
          }

          function getMap(mapFile){
            d3.json(mapFile, function(error, mapData){
              scope._mapData = mapData;
              refreshMap();
            });
          }

          function getPoints(pointsFile){
            d3.json(pointsFile, function(pointData){
              scope._pointData = pointData;
              refreshPoints();
            });
          }

          // Watch on options changing
          scope.$watch('options', function(newOptions, oldOptions){
            if(newOptions !== oldOptions){
              scope._opt = angular.extend(defaultOptions, newOptions);
              refreshAll();
            }
          }, true);

          // Watching on data changing
          scope.$watch('mapData', function(data){
            if(typeof data == 'string'){
              getMap(data)
            }
            else if(typeof data == 'object'){
              scope._mapData = data;
              refreshMap();
            }
          }, true);
          scope.$watch('pointData', function(data){
            if(typeof data == 'string'){
              getPoints(data)
            }
            else if(typeof data == 'object'){
              scope._pointData = data;
              refreshPoints();
            }
          }, true);

        }
      };
    });

})();
