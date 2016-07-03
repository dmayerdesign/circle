(function(_) {
	angular.module('Circle')
	.controller('appBarController', ['$scope', '$rootScope', '$state', '$location', '$http', 'init', 'customizer',
							 						function( $scope,   $rootScope,   $state,   $location,   $http,   init,   customizer) {

		setInterval(function() {
			if ( $location.url().indexOf("single") > -1 ) {
				$rootScope.currentState = "single";
			}
			else if ( $location.url().indexOf("categories") > -1 ) {
				$rootScope.currentState = "categories";
			}
			else if ( $location.url().indexOf("members") > -1 ) {
				$rootScope.currentState = "members";
			}
			else if ( $location.url().indexOf("edit-profile") > -1 ) {
				$rootScope.currentState = "editProfile";
			}
			else {
				$rootScope.currentState = "main";
			}
			$scope.$apply();
		}, 1000);

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




		$scope.refresh = function() {
			console.log($rootScope.currentState);
			if ( $rootScope.currentState !== 'main' ) {
				$state.go('main');
			}
			else {
				window.location.href = "/#/";
				window.location.reload();
			}
		};



		$scope.logOut = function() {
			localStorage.clear();
			document.querySelector("body").className = "";
			$rootScope.loggedIn = false;
			$rootScope.user = undefined;
			$rootScope.currentCircle = undefined;
			$state.go('login');
		};

		$scope.toggleMainMenu = function() {
			var scope = this;
			var $menu = _(".main-menu");
			var $btn = _("#main-menu-toggle");
			var width = $menu.outerWidth(true);
			if ( !scope.mainMenuIsOpen ) {
				$menu.ariaShow();
				TweenMax.to($menu, 0.5, {
					x: 0,
					opacity: 1,
					ease: Expo.easeOut
				});
				$scope.mainMenuIsOpen = true;
			} else {
				TweenMax.to($menu, 0.5, {
					x: -width + "px",
					opacity: 0,
					ease: Expo.easeOut,
					onComplete: function() {
						$menu.ariaHide();
					}
				});
				$scope.mainMenuIsOpen = false;
			}
		};

		$scope.toggleDrawer = function(whichDrawer) {
			var $drawer = _(".bottom-drawer-" + whichDrawer);
			var open = $drawer.hasClass("drawer-open");
			var height = $drawer.outerHeight(true);
			if ( !open && _(".drawer-open").length ) {
				var drawers = ["add", "edit-circle"];

				for (var i=0; i<drawers.length; i++) {
					if ( drawers[i] !== whichDrawer ) {
						$scope.toggleDrawer(drawers[i]);
					}
				}
			}
			if ( !open ) {
				$drawer.ariaShow();
				TweenMax.to($drawer, 0.5, {
					y: 0,
					opacity: 1,
					ease: Expo.easeInOut,
					onComplete: function(which) {
						if ( which === 'add' ) {
							$drawer.find("textarea:first-child").focus();
						}
					},
					onCompleteParams: [whichDrawer]
				});
			} else {
				TweenMax.to($drawer, 0.5, {
					y: height,
					opacity: 0,
					ease: Expo.easeInOut,
					onComplete: function() {
						$drawer.ariaHide();						
					}
				});
			}

			if (whichDrawer === "edit-circle" && !$drawer.hasClass("checked-for-tag")) {
				// Search for filter in query string
				$drawer.addClass("checked-for-tag");
				if ( $location.search().tag ) {
					$http.get('api/tags/getTag?circleId=' + $rootScope.currentCircle._id + '&tagName=' + $location.search().tag).then(function(response) {
						$rootScope.archiveTag = response.data;
						console.log(response.data);
					});
					console.log($scope.postsAreFiltered);
				} else {
					$rootScope.archiveTag = null;
				}
			}

			$drawer.toggleClass("drawer-open");
			_(".posts-archive").toggleClass("bottom-drawer-toggled");
		};

		$scope.switchCircles = function(accessCode) {
			var scope = this;
			var user = this.user;
			var circles = $rootScope.circles;
			var circle = circles[accessCode];

			localStorage.removeItem("Current-Circle");
			localStorage["Current-Circle"] = JSON.stringify(circle);
			$rootScope.currentCircle = circle;
			window.location.href = "/";
		};

		$scope.joinAnotherCircle = function() {
			this.circleJoined = false;
			$rootScope.circleJoined = false;
			$rootScope.currentCircle = null;
			localStorage.removeItem( "Current-Circle" );
			window.location.href = "/#/create-circle";
		};

	}]);
}(jQuery));