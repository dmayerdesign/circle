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
				
				init.getCirclesFromAccessCodes(user.accessCodes, function(circles) {
					$rootScope.circles = circles;
					console.log($rootScope.circles);
				});

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					initUI(function() {
						$rootScope.drawersReady = true;
					});
				});
				customizer.getStyle($rootScope);
				init.initFinal(_("body"));
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

		_(window).load(function() {
			_(document).click(function(e) {
				var _target = _(e.target);
				var _btn = function() {
					if (_target.hasClass("app-bar-btn")) {
						return _target;
					}
					else if (_target.parents(".app-bar-btn").length) {
						return _target.parents(".app-bar-btn");
					}
				}();
				if (_btn) {
					if (_btn.hasClass("active")) {
						_(".active").removeClass("active");
						return;
					} else if (_btn.length) {
						_(".active").removeClass("active");
						_btn.toggleClass("active");
						return;
					}
				}

				if (_(".drawer-open").length && !_target.parents(".bottom-drawer").length && !_target.hasClass("bottom-drawer") && !_target.is(".add-post-btn-container")) {
					if (_(".drawer-open").hasClass("bottom-drawer-add")) {
						$scope.toggleDrawer("add");
					} else {
						$scope.toggleDrawer("edit-circle");
					}
					_(".app-bar-btn").removeClass("active");
				}
			});
		});

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

		function initUI(callback) {
			var initDrawers = function($drawers, $sidebars) {
				$drawers.each(function() {
					var height = _(this).outerHeight(true);
					TweenMax.fromTo( _(this), 0.1, {
						y: 500 // needs to be jumpstarted for some reason
					},
					{
						y: height,
						delay: 1
					});

					_(this).addClass("animation-initiated");
					setResponsiveMaxHeight(_(this).find(".drawer-inner"));
					makeDraggableToClose(_(this));
				});

				$sidebars.each(function() {
					var width = _(this).outerWidth(true);
					TweenMax.fromTo( _(this), 0.1, {
						x: -500 // needs to be jumpstarted for some reason
					},
					{
						x: -width,
						delay: 1
					});

					_(this).addClass("animation-initiated");
					setResponsiveMaxHeight(_(this), true);
					makeDraggable(_(this));
				});
			};
			initDrawers( _(".bottom-drawer"), _(".main-menu") );

			var initAddPost = function() {
				_("#post_type_regular").prop("checked", true);
			};
			initAddPost();

			function setResponsiveMaxHeight(_element, taller) {
				var _window = _(window);
				var offsetTop = parseInt(_("body").css("padding-top"), 10);
				var windowHeight, height, maxHeight, drawerBarHeight;
				function init() {
					windowHeight = _window.height();
					drawerBarHeight = 66;
					height = taller ? (windowHeight - offsetTop + "px") : "auto";
					maxHeight = (windowHeight - offsetTop - drawerBarHeight) + "px";

					_element.css({
						height: height,
						maxHeight: maxHeight
					});
				}
				setInterval(function() {
					init();
				}, 2000);
				_window.load(init);
				_window.resize(init);
			}

			function makeDraggable(_element) {
				if (!_("html.touchevents").length) {
					return;
				}
				_(document)
				.swipe({
  				swipe: function(event, direction, distance, duration, fingerCount){
						if (!_element.hasClass("open") && direction === "right") {
							$scope.toggleMainMenu();
						}

						if (_element.hasClass("open") && direction === "left") {
							$scope.toggleMainMenu();
						}
					},
					allowPageScroll: "vertical"
				});
			}

			function makeDraggableToClose(_element) {
				if (!_("html.touchevents").length) {
					return;
				}
				_element.swipe({
					swipe: function(event, direction, distance, duration, fingerCount){
						if (direction === "down" && _element.hasClass("drawer-open")) {
							if (_element.is(".bottom-drawer-add")) {
								$scope.toggleDrawer("add");
							}
							if (_element.is(".bottom-drawer-edit-circle")) {
								$scope.toggleDrawer("edit-circle");
							}
						}
					},
					allowPageScroll: "vertical"
				});
			}

			if (callback)
				callback();
		}

	}]);
}(jQuery));