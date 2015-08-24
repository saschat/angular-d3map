'use strict';

angular
  .module('d3map-example', ['d3map', 'ngResource'])
  .controller('D3mapCtrl', ['$resource',
    function($resource){
      var self = this;
      self.options = {
        width: 960,
        height: 600,
        projection: 'mercator',
        scale: 9500,
        centerLat: 46.801111,
        centerLon: 8.226667,
        slider: true, // show slider (true/false)
        sliderPos: 'top', // slider position ('top'/'bottom')
        frameLength: 500,
        legend: true // show legend (true/false)
      };

      var map = $resource('assets/map.json').get().$promise
        .then(function(data){
          self.mapData = data;
        });
      $resource('assets/points.json').get().$promise
        .then(function(data){
          self.pointData = data;
        });
    }]);
