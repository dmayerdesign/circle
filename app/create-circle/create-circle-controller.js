(function() {
	angular.module('Circle')
	.controller('createCircleController', ['$scope', '$state', '$location', '$http', '$interval', 'init', 
																function( $scope,   $state,   $location,   $http,   $interval,   init) {

		/**/
		/** INITIALIZE THE USER
		/**/
		if ( localStorage['User'] ) {
			var localUser = JSON.parse(localStorage['User']);
			if ( localUser.email ) {
				$scope.user = localUser;
			}
		}
		if ( !$scope.user || !$scope.user._id ) {
			$state.go('signup');
			return;
		} else {
			$scope.loggedIn = true;
		}
		/* END USER INIT */

		/**/
		/** INITIALIZE THE CIRCLE
		/**/
		if ( localStorage['Current-Circle'] ) {
			$scope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$scope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
		}
		init.getUserAndCircle($scope.user._id, $scope.currentCircle.accessCode, function(user, circle) {
			$scope.user = user; // update $scope.user

			if ( !$scope.user.isEmailVerified ) {
				console.log("email is not verified");
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/#/verify-email?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail;
				}
				$scope.emailVerificationSent = true;
				$state.go('signup');
				return;
			}
		});
		/** END CIRCLE INIT **/

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
			var request = {
				creatorId: $scope.user._id,
				name: $scope.circleName,
				accessRiddle: $scope.accessRiddle,
				accessAnswer: $scope.newAccessAnswer,
				accessCode: $scope.newAccessCode,
				members: [$scope.user._id]
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
					initCircle(circle);
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
				init.getCircle(accessAnswer, accessCode, function(circle) {
					if ( !circle ) {
						console.error("Couldn't join the circle - probably an invalid access code or access answer");
						return;
					}
					init.joinCircle($scope.user, circle, function(user, circle) {
						initCircle(circle);
						window.location.href = "/";
					});
				});
			}
		};

		function initCircle(circle) {
			$scope.loggedIn = true;
			$scope.circle = circle;
			$scope.circleName = circle.name;
			var circles = {};
			circles[circle.accessCode] = circle;
			localStorage.setItem('Circles', JSON.stringify(circles));
			$scope.circleJoined = true;
		}

	}]);
}());