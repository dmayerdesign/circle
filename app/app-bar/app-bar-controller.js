(function(_) {
	angular.module('Circle')
	.controller('appBarController', ['$scope', '$rootScope', '$state', '$http', 'init', 'customizer',
							 						function( $scope,   $rootScope,   $state,   $http,   init,   customizer) {

		$rootScope.user = localStorage['User'] && localStorage['User'].length && JSON.parse(localStorage['User']);
		$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'].length && JSON.parse(localStorage['Current-Circle']);
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
			var scope = this;
			var user = this.user;
			var circles = $rootScope.circles;
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