(function(_) {
	angular.module('Circle')
	.controller('categoriesController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 
													    function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init) {
		console.log( $stateParams );

		$rootScope.currentState = 'single';

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
			$scope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$scope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
		}

		if ( $rootScope.currentCircle ) {
			$scope.currentCircle = $rootScope.currentCircle;
		}

		init.getUserAndCircle($scope.user._id, $scope.currentCircle.accessCode, function(user, circle) {
			$scope.user = user; // update $scope.user

			if ( !$scope.user.isEmailVerified ) {
				console.log("email is not verified");
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail + "/#/verify-email";
				}
				return;
			}

			if ( circle ) {
				init.getMembers(circle.accessCode, function(members) {
					$rootScope.users = members;
				});

				$scope.circleJoined = true;
				$scope.circleName = circle.name;
				$rootScope.currentCircle = circle;

				console.log( circle );
				console.log( $scope.circleJoined );

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					$scope.categories = getTagImages(posts);
				});
			} else {
				$scope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		$scope.categories = [];
		function getTagImages(posts) {
			var scope = $scope;
			scope.tags = $rootScope.currentCircle.tags;

			if ( scope.tags ) {
				for ( var i = 0; i < scope.tags.length; i++ ) {
					var tag = {};
					tag.name = scope.tags[i];

					for ( var index = 0; index < posts.length; index++ ) {
						if ( posts[index].tags.toString().indexOf(tag.name) > -1 ) {

							if ( posts[index].linkEmbed && JSON.parse(posts[index].linkEmbed).thumbnail_url ) {
								var image = JSON.parse(posts[index].linkEmbed).thumbnail_url;
							}
							else if ( posts[index].images.length ) {
								var image = posts[index].images[0];
							}
							else {
								continue;
							}

							tag.image = image;
							scope.categories.push(tag);
							
							break;
						}
						else {
							tag.image = undefined;
							scope.categories.push(tag);

							break;
						}
					}
					console.log(scope.categories);
				}

				return scope.categories;
			}
		}

		// function randomBgClasses() {
		// 	var classArr = [
		// 		"c-bg-primary",
		// 		"c-bg-secondary",
		// 		"c-bg-accent"
		// 	];
		// 	var addClassesInt = setInterval(function() {
		// 		_(".category-tile.bg-not-applied").each(function() {
		// 			$(this)
		// 				.addClass(classArr[Math.floor(Math.random() * 3)])
		// 				.removeClass("bg-not-applied");
		// 		});
		// 		if ( !_(".category-tile.bg-not-applied").length ) {
		// 			clearInterval(addClassesInt);
		// 		}
		// 	}, 500);
		// }
		// randomBgClasses();


	}]);
}(jQuery));