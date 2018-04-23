angular.module('BlocksApp').controller('HomeController', function($rootScope, $scope, $http, $timeout) {
    $scope.$on('$viewContentLoaded', function() {
        // initialize core components
        App.initAjax();
    });

    var URL = '/data';

    $rootScope.isHome = true;

    $scope.reloadBlocks = function() {
      $scope.blockLoading = true;
      $http({
        method: 'POST',
        url: URL,
        data: {"action": "latest_blocks"}
      }).success(function(data) {
        $scope.blockLoading = false;
        $scope.latest_blocks = data.blocks;
      });
    }
    $scope.reloadTransactions = function() {
      $scope.txLoading = true;
      $http({
        method: 'POST',
        url: URL,
        data: {"action": "latest_txs"}
      }).success(function(data) {
        $scope.latest_txs = data.txs;
        $scope.txLoading = false;
      });
    }
    $scope.reloadBlocks();
    $scope.reloadTransactions();
    $scope.txLoading = false;
    $scope.blockLoading = false;
    $scope.settings = $rootScope.setup;
})
.directive('simpleSummaryStats', function($http) {
  return {
    restrict: 'E',
    templateUrl: '/views/simple-summary-stats.html',
    scope: true,
    link: function(scope, elem, attrs){
      scope.stats = {};
      var statsURL = "/stats";
      $http.post(statsURL, {"action": "hashrate"})
       .then(function(res){
          scope.stats.hashrate = res.data.hashrate;
          scope.stats.difficulty = res.data.difficulty;
          scope.stats.blockHeight = res.data.blockHeight;
          scope.stats.blockTime = res.data.blockTime;
        });
      }
  }
})
.directive('siteNotes', function() {
  return {
    restrict: 'E',
    templateUrl: '/views/site-notes.html'
  }
})
//OLD CODE DONT USE
.directive('summaryStats', function($http) {
  return {
    restrict: 'E',
    templateUrl: '/views/summary-stats.html',
    scope: true,
    link: function(scope, elem, attrs){
      scope.stats = {};

      var hucHucURL = "/stats";
      var hucPriceURL = "https://api.coinmarketcap.com/v1/ticker/happyuc-project/";
      var hucPriceURL = "https://api.coinmarketcap.com/v1/ticker/hucereum/"
      scope.stats.hucDiff = 1;
      scope.stats.hucHashrate = 1;
      scope.stats.usdHuc = 1;     
      $http.post(hucHucURL, {"action": "huchuc"})
       .then(function(res){
          scope.stats.hucHashrate = res.data.hucHashrate;
          scope.stats.hucHashrate = res.data.hucHashrate;
          scope.stats.hucHucHash = res.data.hucHucHash;
          scope.stats.hucDiff = res.data.hucDiff;
          scope.stats.hucDiff = res.data.hucDiff;
          scope.stats.hucHucDiff = res.data.hucHucDiff;
        });
      $http.get(hucPriceURL)
       .then(function(res){
          scope.stats.usdEtc = parseFloat(res.data[0]["price_usd"]);
          scope.stats.usdEtcHuc = parseInt(100*scope.stats.usdEtc/scope.stats.usdHuc);
        });
      $http.get(hucPriceURL)
       .then(function(res){
          scope.stats.usdHuc = parseFloat(res.data[0]["price_usd"]);
          scope.stats.usdEtcHuc = parseInt(100*scope.stats.usdEtc/scope.stats.usdHuc);
          scope.stats.hucChange = parseFloat(res.data.change);
        });

      }
  }
});
