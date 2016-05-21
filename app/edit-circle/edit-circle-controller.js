(function() {
	angular.module('Circle')
	.controller('editCircleController', ['Upload', '$scope', '$state', '$http', 'init', 'customizer', function(Upload, $scope, $state, $http, init, customizer) {

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
			$scope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$scope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
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

				$scope.circleJoined = true;
				$scope.circleName = circle.name;
				$scope.circle = circle;

				console.log( circle );
				console.log( $scope.circleJoined );

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
				});
			} else {
				$scope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		$scope.$watch(function() {
			return $scope.file
		}, function() {
			$scope.upload($scope.file);
		});

		$scope.upload = function(file) {
			if (file) {
				Upload.upload({
					url: 'api/circle/updateBackground',
					method: 'POST',
					data: {
						userId: $scope.user._id,
						circleId: $scope.circle._id
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
						part: "bg",
						style: circle.styles.bg
					};

					$http.post('api/circle/style', request).then(function(response) {
						console.log("circle style updated");
						$scope.circle.styles.bg = response.data.circle.styles.bg;
						customizer.getStyle($scope);
					});
				})
				.error(function(err) {
					console.error(err);
				});
			}
		};

		$scope.editCircle = function(part) {
			if ( !$scope.style ) {
				$scope.style = {};
			}
			if ( !$scope.circle.styles ) {
				$scope.circle.styles = {};
			}
			if ( !$scope.style[part] || $scope.style[part].length < 1 ) { return; }

			var request = {
				userId: $scope.user._id,
				circleId: $scope.circle._id,
				accessCode: $scope.circle.accessCode,
				part: part,
				style: $scope.style[part]
			};

			$http.post('api/circle/style', request).then(function(response) {
				console.log("circle style updated");
				$scope.circle.styles[part] = response.data.circle.styles[part];
				customizer.getStyle($scope);
			});

		};


	}]);
}());