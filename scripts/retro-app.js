var retroApp = angular.module('retroApp', ['btford.socket-io']);

retroApp.factory('mySocket', function(socketFactory){
  return socketFactory()
})


retroApp.controller('RetroListController', function ($scope, mySocket, $timeout){

  $scope.autoExpand = function(e) {
      var element = typeof e === 'object' ? e.target : document.getElementById(e);
  		var scrollHeight = element.scrollHeight - 15; // replace 60 by the sum of padding-top and padding-bottom
      element.style.height =  scrollHeight + "px";
  };

  $scope.save = function(index, content, element){
    console.log("Save Card: " + content);
    element.isEdit = false;
    updateCard();
  }

  $scope.delete = function(index, cat){
    console.log("Delete Card");
    $scope.cardlist[cat].splice(index, 1);
    updateCard();
  }

  $scope.add = function(cat){
    console.log("Add New Card")
    $scope.cardlist[cat].push({"content":""});
    updateCard();
  }

  // Send updates to the card list.
  updateCard = function(){
    mySocket.emit('updateCard', $scope.cardlist);
  }

  // Ping for initial data
  mySocket.on('connect', function(){
    console.log("Getting Connection");
    mySocket.emit('getCardList');
  })

  // Distribute card data
  mySocket.on('cardList', function(data){
    console.log("getting card list");
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

  mySocket.on('resetBrowser', function(){
    location.reload();
  })

})
