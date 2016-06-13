(function(_) {
	angular.module('Circle')
	.controller('categoriesController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 
													    function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init) {

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

					init.initFinal(_("body"));

					init.getTags(circle._id, function(tags) {
						$rootScope.categories = tags;
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
			var _archive = _(".category-archive");

			_archive
				.css({height: (winHeight + 30) + "px"}) //.jScrollPane()
				.addClass("initiated");
		};
		var initArchiveInt = setInterval(function() {
			if ( !_(".category-archive").hasClass("initiated") ) {
				initArchive();
				_(window).resize(initArchive);
			} else {
				clearInterval(initArchiveInt);
			}
		}, 200);

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

		$scope.deleteCategory = function(name) {
			var scope = this;
			var request = {
				circleId: $rootScope.currentCircle._id,
				tagName: name
			}
			$http.post('api/tags/deleteTag', request).then(function(response) {
				$rootScope.currentCircle.tags = response.data;
				//localStorage.setItem('Current-Circle', JSON.stringify($rootScope.currentCircle));
				window.location.reload();
			});
		};


	}]);
}(jQuery));