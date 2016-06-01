(function(_) {
	var app = angular.module('Circle', ['ui.router', 'ngFileUpload', 'ngAnimate', 'mentio']);
	
	// CONFIG
	app.config(function($stateProvider, $urlRouterProvider) {

		$urlRouterProvider.otherwise('/');

		$stateProvider
		.state('signup', {
			name: "signup",
			url: "/signup",
			templateUrl: "app/signup/signup.html",
			controller: "signupController"
		})
		.state('login', {
			name: "login",
			url: "/login",
			templateUrl: "app/login/login.html",
			controller: "loginController"
		})
		.state('editProfile', {
			name: "editProfile",
			url: "/edit-profile",
			templateUrl: "app/profile/edit-profile-view.html",
			controller: "editProfileController"
		})
		.state('main', {
			name: "main",
			url: "/",
			templateUrl: "app/main/main.html",
			controller: "mainController"
		})
		.state('single', {
			name: "single",
			url: "/single/:id",
			templateUrl: "app/single/single.html",
			controller: "singleController",
		})
		.state('createCircle', {
			name: "createCircle",
			url: "/create-circle",
			templateUrl: "app/create-circle/create-circle.html",
			controller: "createCircleController",
		})
		.state('editCircle', {
			name: "editCircle",
			url: "/edit-circle",
			templateUrl: "app/edit-circle/edit-circle.html",
			controller: "editCircleController",
		})
		.state('verifyEmail', {
			url: "/verify-email",
			templateUrl: "app/verify-email/verify-email.html",
			controller: "verifyEmailController"
		})
		.state('categories', {
			url: "/categories",
			templateUrl: "app/categories/categories.html",
			controller: "categoriesController"
		})
	});

	// FACTORY
	app.factory('init', function($http, $state) {
		var init = {};

		init.getUserAndCircle = function getUserAndCircle(id, code, callback) {
			if ( localStorage['Current-Circle'] && localStorage['User'] ) {
				if ( JSON.parse(localStorage['Current-Circle']).id === id && JSON.parse(localStorage['User']).accessCodes.toString().indexOf(code) > -1 ) {
					callback(JSON.parse(localStorage['User']), JSON.parse(localStorage['Current-Circle']));
					return;
				}
			}
			$http.get('api/users/getUser?userId=' + id).then(function(response) {
				var user = response.data;
				var circles = user.circles ? JSON.parse(user.circles) : null;
				if (circles && circles.undefined) { // if they somehow got past the access code duplicate validation
					localStorage.clear();
					$state.go('login');
					return;
				}
				localStorage.setItem('User', JSON.stringify(user));

				if ( user.circles && user.circles.length ) {
					console.log(user);

					var circles = JSON.parse(user.circles);
					var accessCode = code || user.accessCodes[0];
					var accessAnswer = circles[accessCode].accessAnswer;

					console.log(accessCode);

					if ( !accessCode || !accessAnswer ) {
						$state.go('createCircle');
						return;
					}

					$http.get('api/circle/get?accessCode=' + accessCode + '&accessAnswer=' + accessAnswer).then(function(response) {
						var circle = response.data;
						console.log(circle);

						if ( localStorage['Circles'] && !JSON.parse(localStorage['Circles']).accessCode ) {
							var circles = JSON.parse(localStorage['Circles']);
						} else {
							var circles = {};
						}

						circles[accessCode] = circle;
						localStorage.setItem('Circles', JSON.stringify(circles));
						localStorage.setItem('Current-Circle', JSON.stringify(circle));

						callback(user, circle);
					});
				} else {
					callback(user);
				}
			});
		};

		init.getCircle = function getCircle(accessAnswer, accessCode, callback) {
			$http.get('api/circle/get?accessCode=' + accessCode + '&accessAnswer=' + accessAnswer).then(function(response) {
				var circle = response.data;

				if ( localStorage['Circles'] && !JSON.parse(localStorage['Circles']).accessCode ) {
					var circles = JSON.parse(localStorage['Circles']);
				} else {
					var circles = {};
				}

				circles[accessCode] = circle;
				localStorage.setItem('Circles', JSON.stringify(circles));
				localStorage.setItem('Current-Circle', JSON.stringify(circle));

				if (callback) {
					callback(circle);
				}
			});
		};

		init.joinCircle = function joinCircle( user, circle, callback ) {
			if ( localStorage['Circles'] && !JSON.parse(localStorage['Circles']).accessCode ) {
				var circles = JSON.parse(localStorage['Circles']);
			} else {
				var circles = {};
			}

			var request = {
				userId: user._id
			};

			circles[circle.accessCode] = circle;

			request.circles = JSON.stringify(circles);
			request.accessCode = circle.accessCode;

			$http.post('api/profile/editProfile', request).then(function(response) {
				var user = response.data;
				var circles = response.data.circles;

				console.log(response.data);
				localStorage.setItem('Circles', JSON.stringify(circles));
				localStorage.setItem('User', JSON.stringify(user));

				if ( circle.creatorId === user._id ) {
					if (callback) {
						callback(user, circle);
					}
				} else {
					$http.post('api/circle/addMember', {circleId: circle._id, member: user.username}).then(function(response) {
						circle = response.data;
						localStorage.setItem('Current-Circle', JSON.stringify(response.data));

						if (callback) {
							callback(user, circle);
						}
					});
				}
			});
		};

		init.getPosts = function getPosts(circleId, callback) {
			$http.get('api/post/get?circleId=' + circleId)
			.then(function(response) {
				if (callback) {
					callback(response.data);
				}
			});
		};

		init.getMembers = function getMembers(accessCode, callback) {
			$http.get('api/users/get?accessCode=' + accessCode)
			.then(function(response) {
				if (callback) {
					callback(response.data);
				}
			});
		};

		init.fadeCircleIn = function fadeCircleIn() {
			TweenMax.to(document.querySelector("body"), 0.4, {
				opacity: 1,
				ease: Power2.easeOut,
				delay: 0.2
			});
		};

		return init;
	});

	app.factory('action', function($http, $state) {
		var action = {};

		action.loadMore = function loadMore(circleId, callback) {
			$http.get('api/post/get?circleId=' + circleId)
			.then(function(response) {
				if (callback) {
					callback(response.data);
				}
			}, function(error) {
				console.error(error);
			});
		};

		action.tagUser = function tagUser(username, callback) {
			$http.get('api/users/getUser?username=' + username)
			.then(function(response) {
				var user = response.data;
				if (user) {
					if (callback) {
						callback(user);
					}
				}
			}, function(error) {
				console.error(error);
			});
		};

		action.clearNotification = function clearNotification(userId, all, id, callback) {
			$http.post('api/user/clearNotification', {
				clearAll: all,
				userId: userId,
				notificationId: id
			}).then(function(response) {
				if (callback) {
					callback(response.data);
				}
			}, function(error) {
				console.error(error);
			});
		};

		return action;
	});

	app.factory('customizer', function($http, $state) {
		var customizer = {};

		customizer.getStyle = function getStyle($scope) {
			document.querySelector("body")
				.className =  "theme-" + $scope.currentCircle.styles.theme
							+ " palette-" + $scope.currentCircle.styles.palette
							+ " font-" + $scope.currentCircle.styles.font;
			document.querySelector("#background")
				.style.backgroundImage = "url(" + $scope.currentCircle.styles.bg + ")";
			
			// var _customCSS = _("<style></style>");
			// _customCSS.html( $scope.currentCircle.styles.css );
			// _("head").append(_customCSS);

			var fontLink;
			if ( $scope.currentCircle.styles.font === "open-sans" && !jQuery(".open-sans-link").length ) { fontLink = "<link class='font-link open-sans-link' href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,700,700italic' rel='stylesheet' type='text/css'>"; }
			if ( $scope.currentCircle.styles.font === "montserrat" && !jQuery(".montserrat-link").length ) { fontLink = "<link class='font-link montserrat-link' href='https://fonts.googleapis.com/css?family=Montserrat:400,700' rel='stylesheet' type='text/css'>"; }
			
			_(".font-link").remove();
			_("head").append(fontLink);

			return $scope;
		};

		return customizer;
	});

	app.directive('backImg', function(){
    return function(scope, element, attrs){
      attrs.$observe('backImg', function(value) {
        element.css({
          'background-image': 'url(' + value +')',
          'background-size' : 'cover'
        });
      });
    };
	});

	app.filter('startFrom', function() {
		return function(input, start) {
	    if(input) {
	      start = +start; //parse to int
	      return input.slice(start);
	    }
	    return [];
		}
	});

}(jQuery));