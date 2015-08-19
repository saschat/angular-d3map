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
        center_lat: 46.801111,
        center_lon: 8.226667,
        slider: true, // show slider (true/false)
        slider_pos: 'top', // slider position ('top'/'bottom')
        frame_length: 500,
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
