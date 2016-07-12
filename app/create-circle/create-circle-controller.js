(function(_) {
	angular.module('Circle')
	.controller('createCircleController', ['$scope', '$rootScope', '$state', '$location', '$http', '$interval', 'init', 
																function( $scope,   $rootScope,   $state,   $location,   $http,   $interval,   init) {

		$rootScope.currentState = 'create-circle';

		$rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
		//$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']);
		if (!$rootScope.user || !$rootScope.user.email) {
			$state.go('signup');
			return;
		}
		$rootScope.loggedIn = true;
		// init.app($rootScope.user._id, false, function(user, circle) {
		// 	$rootScope.user = user;
		// 	if (circle) {
		// 		$rootScope.circleJoined = true;
		// 		$rootScope.currentCircle = circle;
		// 		$rootScope.circles = localStorage['Circles'] && localStorage['Circles'].length && JSON.parse(localStorage['Circles']);
		// 		init.getPosts(circle._id, function(posts) {
		// 			$scope.posts = posts;
		// 		});
		// 		customizer.getStyle($rootScope);
		// 	} else {
		// 		$rootScope.circleJoined = false;
		// 		$state.go('createCircle');
		// 	}
		// });

		init.initFinal(_("body"));

		$scope.optJoin = false;
		$scope.optCreate = false;

		$scope.validateAccessAns = function() {
			if ( $scope.newAccessAnswer && $scope.newAccessAnswer.length ) {
				$scope.validationStarted = true;
			}
			$scope.accessAnswerValid = false;
			if ( $scope.newAccessAnswer && $scope.newAccessAnswer.length < 5 ) {
				$scope.accessAnswerTooShort = true;
				return;
			}
			if ( !$scope.newAccessAnswer ) {
				$scope.validationStarted = false;
				return;
			}
			$http.get('api/circle/get?accessAnswer=' + $scope.newAccessAnswer).then(function(response) {
				var circle = response.data;
				if ( circle.accessAnswer ) {
					return;
				} else {
					$scope.accessAnswerTooShort = false;
					$scope.accessAnswerValid = true;
				}
			});
		};

		$scope.validateCircleName = function() {
			$scope.circleNameValidationStarted = true;
			if ( !$scope.circleName ) {
				$scope.circleNameValidationStarted = false;
				return;
			}
			if ( $scope.circleName.length < 2 ) {
				$scope.circleNameValid = false;
			} else {
				$scope.circleNameValid = true;
			}
		};

		$scope.createCircle = function() {
			if ( !$scope.accessAnswerValid || !$scope.circleNameValid || !$scope.nameChosen ) {
				$scope.nameChosen = true;
				return;
			}

			$scope.newAccessCode = makeAccessCode();

			if ( $rootScope.user ) {
				var creator = $rootScope.user;
			} else {
				var creator = $scope.user;
			}

			var request = {
				creatorId: creator._id,
				name: $scope.circleName,
				accessRiddle: $scope.accessRiddle,
				accessAnswer: $scope.newAccessAnswer,
				accessCode: $scope.newAccessCode,
				members: [creator.username]
			};
			function makeAccessCode() { var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for ( var i=0; i < 12; i++ ) { text += possible.charAt(Math.floor(Math.random() * possible.length)); } return text; }

			$http.post('api/circle/new', request).then(function(response) {
				var circle = response.data;

				console.log(circle);

				$http.post('api/tags/addTag', {
					name: 'random',
					circleId: circle._id
				});

				init.joinCircle( $scope.user, circle, function(user, circle) {
					init.circle(circle.accessCode);
					$http.post("email/newCircle", {email: user.email, circleData: circle})
					.success(function(response) {
						console.log(response);
						window.location.href = '/';
					})
					.error(function(err) {
						console.error( JSON.parse(err) );
					});
				});
			});
		};

		$scope.joinCircle = function() {
			var accessCode = $scope.accessCode;
			var accessAnswer = $scope.accessAnswer;
			if ( accessCode && accessAnswer ) {
				init.circle(accessCode, function(circle) {
					if ( !circle ) {
						console.error("Couldn't join the circle - probably an invalid access code or access answer");
						return;
					}
					init.joinCircle($scope.user, circle, function(user, circle) {
						window.location.href = "/";
					});
				});
			}
		};

	}]);
}(jQuery));