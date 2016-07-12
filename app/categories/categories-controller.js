(function(_) {
	angular.module('Circle')
	.controller('categoriesController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 'generate',
													    function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init,   generate) {

		$rootScope.archiveTag = null;

		$rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
		$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']);
		if (!$rootScope.user) {
			$state.go('signup');
			return;
		}
		$rootScope.loggedIn = true;
		init.app($rootScope.user._id, false, function(user, circle) {
			$rootScope.user = user;
			if ( !$rootScope.user.isEmailVerified ) {
				console.log("email is not verified");
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/#/verify-email?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail;
				}
				$scope.emailVerificationSent = true;
				$state.go('signup');
				return;
			}
			if (circle) {
				$rootScope.circleJoined = true;
				$rootScope.currentCircle = circle;
				$rootScope.circles = localStorage['Circles'] && localStorage['Circles'].length && JSON.parse(localStorage['Circles']);
				init.getMembers(circle.accessCode, function(members) {
					$rootScope.users = members;
				});
				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					$scope.postsAllowed = {allow: 20};

					init.getTags(circle._id, function(tags) {
						$rootScope.categories = tags;

						angular.forEach($rootScope.categories, function(category) {
							category.randomBg = 'images/category-bg-' + generate.randomInteger(6) + '.jpg';
						});
					});
				});

			} else {
				$rootScope.circleJoined = false;
				$state.go('createCircle');
			}
		});

		var initArchive = function() {
			var $head = _("head");
			var winHeight = _(window).height();
			var _archive = _(".category-archive-container");

			_archive
				.css({height: (winHeight + 30) + "px"}) //.jScrollPane()
				.addClass("initiated");
		};
		var initArchiveInt = setInterval(function() {
			if ( !_(".category-archive-container").hasClass("initiated") ) {
				initArchive();
				_(window).resize(initArchive);
			} else {
				clearInterval(initArchiveInt);
			}
		}, 200);

		$scope.deleteCategory = function(name) {
			if (window.confirm("Delete the category '" + name + "'?")) {
				var scope = this;
				var request = {
					circleId: $rootScope.currentCircle._id,
					tagName: name
				}
				$http.post('api/tags/deleteTag', request).then(function(response) {
					$rootScope.currentCircle.tags = response.data;
					window.location.reload();
				});
			}
		};

		// $scope.randomCategoryBg = function() {
		// 	var bg = 'images/category-bg-' + generate.randomInteger(4) + '.jpg';
		// 	return bg;
		// };


	}]);
}(jQuery));