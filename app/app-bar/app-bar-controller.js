(function(_) {
	angular.module('Circle')
	.controller('appBarController', ['$scope', '$rootScope', '$state', '$http', 'init', 'customizer',
							 						function( $scope,   $rootScope,   $state,   $http,   init,   customizer) {

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
			$rootScope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$rootScope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
		}

		init.getUserAndCircle($scope.user._id, $scope.currentCircle.accessCode, function(user, circle) {
			$rootScope.user = user; // update $scope.user

			if ( circle ) {
				init.getMembers(circle.accessCode, function(members) {
					$scope.users = members;
				});

				$rootScope.circleJoined = true;
				$rootScope.circleName = circle.name;
				$rootScope.currentCircle = circle;
				$rootScope.circles = JSON.parse($scope.user.circles);

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
				});

				customizer.getStyle($rootScope);
			} else {
				$scope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		$scope.logOut = function() {
			localStorage.clear();
			document.querySelector("body").className = "";
			$scope.loggedIn = false;
			$rootScope.user = undefined;
			$rootScope.currentCircle = undefined;
			$state.go('login');
		};

		$scope.toggleMainMenu = function() {
			var $menu = jQuery(".main-menu");
			var open = $menu.hasClass("menu-open");
			var width = $menu.outerWidth(true);
			if ( !open ) {
				$menu.ariaShow();
				TweenMax.to($menu, 0.5, {
					x: 0,
					opacity: 1,
					ease: Expo.easeOut
				});
			} else {
				TweenMax.to($menu, 0.5, {
					x: -width + "px",
					opacity: 0,
					ease: Expo.easeOut,
					onComplete: function() {
						$menu.ariaHide();
					}
				});
			}

			$menu.toggleClass("menu-open");
		};

		$scope.toggleDrawer = function(whichDrawer) {
			var $drawer = jQuery(".bottom-drawer-" + whichDrawer);
			var open = $drawer.hasClass("drawer-open");
			var height = $drawer.outerHeight(true);
			if ( !open && jQuery(".drawer-open").length ) {
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

			$drawer.toggleClass("drawer-open");
			_(".posts-archive").toggleClass("bottom-drawer-toggled");
		};

		$scope.switchCircles = function(accessCode) {
			var user = this.user;
			var circles = JSON.parse(user.circles);
			var circle = circles[accessCode];

			localStorage.removeItem( "Current-Circle" );
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