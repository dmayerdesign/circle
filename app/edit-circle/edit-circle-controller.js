(function() {
	angular.module('Circle')
	.controller('editCircleController', ['Upload', '$scope', '$rootScope', '$state', '$http', '$location', 'init', 'customizer', 
															function( Upload,   $scope,   $rootScope,   $state,   $http,   $location,   init,   customizer) {

		$rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
		$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']);
		if (!$rootScope.user) {
			$state.go('signup');
			return;
		}
		$rootScope.loggedIn = true;
		init.app($rootScope.user._id, false, function(user, circle) {
			$rootScope.user = user;
			if (circle) {
				$rootScope.circleJoined = true;
				$rootScope.currentCircle = circle;
				$rootScope.circles = localStorage['Circles'] && localStorage['Circles'].length && JSON.parse(localStorage['Circles']);
				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
				});
				customizer.getStyle($rootScope);
			} else {
				$rootScope.circleJoined = false;
				$state.go('createCircle');
			}
		});



		

		$scope.$watch(function() {
			return $scope.file
		}, function() {
			$scope.upload($scope.file);
		});

		$scope.upload = function(part, file) {
			var endpoint;
			if ( part === 'bg' ) { endpoint = 'api/circle/updateBackground'; }
			if ( part === 'logo' ) { endpoint = 'api/circle/updateLogo'; }
			if ( part === 'tagImage' ) { endpoint = 'api/tags/updateImage'; }

			if (file && part && part !== 'tagImage') {
				Upload.upload({
					url: endpoint,
					method: 'POST',
					data: {
						userId: $rootScope.user._id,
						circleId: $rootScope.currentCircle._id
					},
					file: file
				})
				.progress(function(e) {
					console.log("uploading");
				})
				.success(function(circle) {
					console.log(circle);

					// var request = {
					// 	userId: $scope.user._id,
					// 	circleId: circle._id,
					// 	accessCode: circle.accessCode,
					// 	part: part,
					// 	style: circle.styles[part]
					// };

					// $http.post('api/circle/style', request).then(function(response) {
					console.log("circle style updated");
					// $rootScope.currentCircle.styles[part] = response.data.circle.styles[part];
					$rootScope.currentCircle = circle;
					localStorage.setItem("Current-Circle", JSON.stringify(circle));

					console.log( $rootScope.currentCircle.styles );
					customizer.getStyle($rootScope);
					// });
				})
				.error(function(err) {
					console.error(err);
				});
			}
			if (file && part && part == 'tagImage' && $location.search().tag) {
				Upload.upload({
					url: endpoint,
					method: 'POST',
					data: {
						userId: $rootScope.user._id,
						circleId: $rootScope.currentCircle._id,
						tagName: $location.search().tag
					},
					file: file
				})
				.progress(function(e) {
					console.log("uploading");
				})
				.success(function(tag) {
					console.log(tag);
					console.log("tag image updated");
					$rootScope.archiveTag = tag;
				})
				.error(function(err) {
					console.error(err);
				});
			}
		};

		$scope.styleCircle = function(part) {
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

		$scope.editCurrency = function() {
			var scope = this;
			var request;
			if ( !scope.currentCircle.currency ) { return; }
			request = {
				circleId: $rootScope.currentCircle._id,
				currency: scope.currentCircle.currency,
				lastEditedBy: $rootScope.user._id
			};
			$http.post('api/circle/updateCurrency', request).then(function(response) {
				$rootScope.currentCircle = response.data;
				console.log(response.data);
			});
		};


	}]);
}());