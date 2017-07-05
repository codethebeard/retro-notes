var retroApp = angular.module('retroApp', ['btford.socket-io']);

retroApp.factory('mySocket', function(socketFactory){
  return socketFactory()
})


retroApp.controller('RetroReviewController', function ($scope, mySocket, $timeout){

  $scope.print = function(){
    // var printSection = document.getElementById('print');
    // var printSectionClone = angular.element(printSection).clone();
    // var doc = document.getElementsByTagName('body')[0];
    // angular.element(doc).prepend(printSectionClone);
    window.print();
  }

  $scope.worddoc = function(){
    mySocket.emit('microdoc');
  }

  $scope.reset = function(){
    console.log("Reset");
    mySocket.emit('reset');
  }

  // Ping for initial data
  mySocket.on('connect', function(){
    console.log("Getting Connection");
    mySocket.emit('getCardList');
  })

  // Distribute card data
  mySocket.on('cardList', function(data){
    $scope.cardlist = data;
  })

  // Display Notification when new user connects.
  mySocket.on('notification', function(message){
    $scope.notification = message;
    var notification = document.querySelectorAll('.notification');
    angular.element(notification).addClass('active');
    $timeout(function(){
      angular.element(notification).removeClass('active');
    }, 3000);
  });




})
