(function() {
	angular.module('Circle')
	.controller('appBarController', ['$scope', '$state', '$http', 'init', 'customizer', function($scope, $state, $http, init, customizer) {

		/**/
		/** INITIALIZE THE USER
		/**/
		if ( localStorage['User'] ) {
			var localUser = JSON.parse(localStorage['User']);
			if ( localUser.email ) {
				$scope.user = localUser;
				$scope.circles = $scope.user.circles && JSON.parse($scope.user.circles);
			}
		}
		if ( !$scope.user || !$scope.user._id ) {
			$state.go('login');
			return;
		} else {
			$scope.loggedIn = true;
		}

		function getParameterByName(name, url) { if (!url) url = window.location.href; name = name.replace(/[\[\]]/g, "\\$&"); var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url); if (!results) return null; if (!results[2]) return null; return decodeURIComponent(results[2].replace(/\+/g, " ")); }
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
				if ( getParameterByName("email") && getParameterByName("verifyEmail") ) {
					window.location.href = '/?email=' + getParameterByName("email") + "&verifyEmail=" + getParameterByName("verifyEmail") + "/#/verify-email";
				}
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

				customizer.getStyle($scope);
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
		};

		$scope.switchCircles = function(accessCode) {
			var user = this.user;
			var circles = JSON.parse(user.circles);
			var circle = circles[accessCode];

			localStorage.removeItem( "Current-Circle" );
			$state.go('main');
			window.location.reload();
		};

		$scope.joinAnotherCircle = function() {
			this.circleJoined = false;
			this.currentCircle = null;
			localStorage.removeItem( "Current-Circle" );
			window.location.href = '/#/create-circle';
		};

	}]);
}());