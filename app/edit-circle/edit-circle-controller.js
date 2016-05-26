(function() {
	angular.module('Circle')
	.controller('editCircleController', ['Upload', '$scope', '$rootScope', '$state', '$http', 'init', 'customizer', 
															function( Upload,   $scope,   $rootScope,   $state,   $http,   init,   customizer) {

		/**/
		/** INITIALIZE THE USER
		/**/
		if ( localStorage['User'] ) {
			var localUser = JSON.parse(localStorage['User']);
			if ( localUser.email ) {
				$rootScope.user = localUser;
			}
		}
		if ( !$scope.user || !$scope.user._id ) {
			$state.go('login');
			return;
		} else {
			$scope.loggedIn = true;
		}
		/* END USER INIT */

		/**/
		/** INITIALIZE THE CIRCLE
		/**/
		if ( localStorage['Current-Circle'] ) {
			$rootScope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$rootScope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
		}
		init.getUserAndCircle($scope.user._id, $scope.currentCircle.accessCode, function(user, circle) {
			$scope.user = user; // update $scope.user

			if ( !$scope.user.isEmailVerified ) {
				console.log("email is not verified");
				return;
			}

			if ( circle ) {
				init.getMembers(circle.accessCode, function(members) {
					$scope.users = members;
				});

				$rootScope.circleJoined = true;
				$rootScope.circleName = circle.name;
				$rootScope.currentCircle = circle;

			} else {
				$rootScope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		$scope.$watch(function() {
			return $scope.file
		}, function() {
			$scope.upload($scope.file);
		});

		$scope.upload = function(part, file) {
			var endpoint;
			if ( part === 'bg' ) { endpoint = 'api/circle/updateBackground'; }
			if ( part === 'logo' ) { endpoint = 'api/circle/updateLogo'; }

			if (file && part) {
				Upload.upload({
					url: endpoint,
					method: 'POST',
					data: {
						userId: $scope.user._id,
						circleId: $rootScope.currentCircle._id
					},
					file: file
				})
				.progress(function(e) {
					console.log("uploading");
				})
				.success(function(circle) {
					console.log(circle);
					var request = {
						userId: $scope.user._id,
						circleId: circle._id,
						accessCode: circle.accessCode,
						part: part,
						style: circle.styles[part]
					};

					$http.post('api/circle/style', request).then(function(response) {
						console.log("circle style updated");
						$rootScope.currentCircle.styles[part] = response.data.circle.styles[part];

						var currentCircle = localStorage['Current-Circle'] && JSON.parse(localStorage['Current-Circle']);
						currentCircle.styles = $rootScope.currentCircle.styles;
						localStorage.setItem("Current-Circle", JSON.stringify(currentCircle));

						console.log( $rootScope.currentCircle.styles );
						customizer.getStyle($rootScope);
					});
				})
				.error(function(err) {
					console.error(err);
				});
			}
		};

		$scope.editCircle = function(part) {
			var scope = this;
			if ( !$rootScope.currentCircle.styles ) {
				$rootScope.currentCircle.styles = {};
			}
			if ( !$rootScope.currentCircle.styles[part] || $rootScope.currentCircle.styles[part].length < 1 ) { return; }

			var request = {
				userId: $scope.user._id,
				circleId: $rootScope.currentCircle._id,
				accessCode: $rootScope.currentCircle.accessCode,
				part: part,
				style: scope.currentCircle.styles[part]
			};

			$http.post('api/circle/style', request).then(function(response) {
				$rootScope.currentCircle.styles[part] = response.data.circle.styles[part];

				var currentCircle = localStorage['Current-Circle'] && JSON.parse(localStorage['Current-Circle']);
				currentCircle.styles = $rootScope.currentCircle.styles;
				localStorage.setItem("Current-Circle", JSON.stringify(currentCircle));
				
				customizer.getStyle($rootScope);
			});

		};


	}]);
}());