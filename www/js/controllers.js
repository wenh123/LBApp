var MyApp = angular.module('starter.controllers', [])
var storage = localStorage;
var Mydomain = "http://163.18.2.35:3000/";

MyApp.controller('LogInCtrl', function($scope,$state,$http) {
	
	$scope.user = {};
	
	$scope.Connect = function(account,password){
		$http.post(Mydomain+'api/login',{
			act:account,
			pwd:password,
		}).
		success(function(data) {
			if(data.status){
				storage.setItem('user',account);
				storage.setItem('pwd',password);
				$state.go('tab.dash')
			}
			else alert("account error")
		}).
		error(function(data) {
			
		});
	}
	
	$scope.Login = function(){
		$scope.Connect($scope.user.account,$scope.user.password);
	}
	
	$scope.CheckLogin = function(){
		var user = storage.getItem('user')
		var pwd = storage.getItem('pwd')
		if(user!='undefined' && pwd!='undefined' && user!=null && pwd!=null){
			//$scope.user.account = user;
			//$scope.user.password = pwd;
			$scope.Connect(user,pwd);
		}
	}
	
	$scope.CheckLogin();

});

MyApp.controller('DashCtrl', function($scope,$state,$timeout,$interval,$ionicPlatform,socket) {
	var BeaconArray = [];
	var IndoorInterval;
	var Loginfo = {
		"account":storage.getItem('user'),
		"courses":[]
	}
	
	$scope.StartRanging = function(){
		//console.log("Then go")
		function successful(beaconInfo){
			BeaconArray = beaconInfo.beacons;
		}
		
		function error(message){
			console.log('Ranging beacons did fail: ' + message);
		}
		
		EstimoteBeacons.startRangingBeaconsInRegion({},successful,error);
	};
	
	$scope.SignIn = function(){
		IndoorInterval = $interval(function(){
			Loginfo = {
				"account":storage.getItem('user'),
				"courses":[]
			}
			for(i in BeaconArray){
				var CacheArray = {
					"beacons":{
						"uuid" : "b9407f30-f5f8-466e-aff9-25556b57fe6d",
						"major" : (BeaconArray[i].major).toString(),
						"minor" : (BeaconArray[i].minor).toString()
					},"status":true}
				Loginfo.courses.push(CacheArray);
			}
			//console.log(Loginfo);
			console.log(BeaconArray)
			socket.emit('student login',Loginfo);
		},1500)
		//$scope.StartRanging();
	}
	
	$scope.Answer = function(CorrectAnswer){
		socket.emit('student answer',{answer:CorrectAnswer});
		$scope.AnswerCounter = [];
	}
	
	socket.on('connect', function () {
		console.log('connected');
	});

	socket.on('io connected',function(id){
		console.log('Have Login');
		EstimoteBeacons.stopRangingBeaconsInRegion({},(function(){
			if(angular.isDefined(IndoorInterval)){
				$interval.cancel(IndoorInterval);
			}
		})(),onError);
	})
	
	socket.on('disconnect', function () {
		console.log('Disconnected');
	});
	
	socket.on('student question', function(data){
		console.log(data);
		$scope.AnswerCounter = [];
		for(var i = 0; i<data;i++){
			$scope.AnswerCounter.push(String.fromCharCode(65+i));
		}
	});
	
	$scope.$on('$ionicView.enter', function(){
		$timeout(function() {
			console.log(Loginfo.account)
			$scope.StartRanging();
			$scope.SignIn();
		},800);
	});
	
	$ionicPlatform.ready(function() {
		document.addEventListener("resume", function() {
			console.log("The application is resuming from the background");
			$timeout(function() {
				console.log(Loginfo.account)
				$scope.StartRanging();
				$scope.SignIn();
			},800);
		}, false);
		
		document.addEventListener("pause", function() {
			socket.emit('student logout',false);
		}, false);
		
	});
	
	$scope.settings = {
		enableFriends: true
	};
	
	$scope.LogOut = function(){
		storage.clear();
		$state.go('login')
	}

});
