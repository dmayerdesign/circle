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

	/*

	init in the controller should look like

	$rootScope.user = localStorage['User'] && localStorage['User'].length && JSON.parse(localStorage['User']);
	$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'].length && JSON.parse(localStorage['Current-Circle']);
	init.app(false, function(user, circle) {
		$rootScope.user = user;
		$rootScope.currentCircle = circle;
	});

	*/

	// FACTORY
	app.factory('init', function($http, $state) {
		var init = {};

		init.user = function(userId, callback) {
			$http.get('api/users/getUser?userId=' + userId).then(function(response) {
				localStorage.setItem('User', JSON.stringify(response.data));
				if (callback)
					callback(response.data);
			});
		};

		init.circle = function(accessCode, callback) {
			$http.get('api/circle/get?accessCode=' + accessCode).then(function(response) {
				var circle = response.data;
				var localCircles = localStorage['Circles'];
				var circles = {};
				if ( localCircles && localCircles.length ) {
					circles = JSON.parse(localCircles);
				}

				if (!accessCode) {
					$state.go('createCircle');
					return;
				}

				circles[accessCode] = circle;
				localStorage.setItem('Circles', JSON.stringify(circles));
				localStorage.setItem('Current-Circle', JSON.stringify(circle));

				if (callback)
					callback(circle);
			});
		};

		init.app = function(userId, accessCode, callback) {
			var that = this;
			var localCode = localStorage['Current-Circle'] && localStorage['Current-Circle'].length && JSON.parse(localStorage['Current-Circle']).accessCode;
			var code;

			that.user(userId, function(user) {
				code = accessCode || localCode || user.accessCodes[0];
				that.circle(code, function(circle) {
					callback(user, circle);
				});
			});
		};

		init.joinCircle = function(user, credentials, callback) {
			var localCircles = localStorage['Circles'];
			var circles = {};
			var circle, request, user;
			if ( localCircles && localCircles.length ) {
				circles = JSON.parse(localCircles);
			}

			if ( !credentials.accessCode || !credentials.accessAnswer ) {
				console.error("Credentials don't exist, can't join the circle");
				return;
			}

			$http.get('api/circle/get?joining=true&accessCode=' + credentials.accessCode + '&accessAnswer=' + credentials.accessAnswer).then(function(response) {
				circle = response.data;
				circles[credentials.accessCode] = circle;

				localStorage.setItem('Circles', JSON.stringify(circles));

				request = {
					userId: user._id,
					accessCode: circle.accessCode
				};

				$http.post('api/profile/editProfile', request).then(function(response) {
					user = response.data;
					
					localStorage.setItem('User', JSON.stringify(user));

					if ( circle.creatorId === user._id ) {
						localStorage.setItem('Current-Circle', JSON.stringify(circle));
						if (callback) {
							callback(user, circle);
						}
					} else {
						$http.post('api/circle/addMember', {circleId: circle._id, member: user.username}).then(function(response) {
							localStorage.setItem('Current-Circle', JSON.stringify(response.data));

							if (callback) {
								callback(user, circle);
							}
						});
					}
				});
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

		init.getTags = function getTags(circleId, callback) {
			$http.get('api/tags/get?circleId=' + circleId)
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

		init.initFinal = function initFinal(obj) {
			obj.removeClass("not-visible");
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

		action.treatPost = function treatPost(scope, rootScope, callback) {
			var treatPostInt = setInterval(function() {
				//if (_("#post.not-treated").length) {
					treatLink(scope, rootScope, function(content) {
						treatTags(scope, rootScope, content, function(content) {
							treatMentions(scope, rootScope, content, function(post) {
								if (callback)
									callback(post);
							});
						});
					});						
				// } else {
				// 	clearInterval(treatPostInt);
				// }
			}, 1000);

			function treatLink(scope, rootScope, callback) {
				var _post = _("#post");
				var _article = _post.find("article.content");
				var content = _article.text();
				var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
				var match = urlPattern.exec(content);
				var theLink;

				if ( match ) {
					theLink = match[0];
					content = content.split(theLink);

					content[0] += "<a href='" + theLink + "' target='_blank'>" + theLink + "</a>";
					content = content.join("");

					if ( !rootScope.post.linkEmbed ) {
						_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
							if ( data.type === "photo" ) {
								data["src"] = data.url;
							} else {
								data["src"] = data.thumbnail_url;
							}
							console.log(data);
							scope.linkPreview = data;
						});
					} else {
						scope.linkPreview = rootScope.post.linkEmbed;
					}
				} else {
					scope.linkPreview = null;
				}

				callback(content);

				_post.removeClass("not-treated");
			}

			function treatTags(scope, rootScope, content, callback) {
				var _post = _("#post");
				var _article = _post.find("article.content");
				//var content = _article.text();
				var tagPattern = /\#([^\s.,!?\-:\(\)]*)/gi;
				var tagMatch = content.match(tagPattern);
				var theTag, i;

				if ( tagMatch && tagMatch.length ) {
					for (i = 0; i < tagMatch.length; i++) {
						theTag = tagMatch[i];
						content = content.split(theTag);
						content[0] += "<a href='/#/?tag=" + theTag.replace("#", "") + "'>" + theTag + "</a>";
						content = content.join("");
					
						if (i === tagMatch.length - 1) {
							_post.removeClass("not-treated");
						}
					}
				} else {
					setTimeout(function() {
						_post.removeClass("not-treated");
					}, 5000);
				}

				// console.log(content);
				// _article.html(content);

				callback(content);
			}

			function treatMentions(scope, rootScope, content, callback) {
				var _post = _("#post");
				var _article = _post.find("article.content");
				//var content = _article.text();
				var mentionPattern = /\@([^\s.,!?\-:\(\)]*)/gi;
				var mentionMatch = content.match(mentionPattern);
				var theMention, i;

				if ( mentionMatch && mentionMatch.length ) {
					for (i = 0; i < mentionMatch.length; i++) {
						theMention = mentionMatch[i];
						content = content.split(theMention);
						content[0] += "<a href='/#/?user=" + theMention.replace("@", "") + "' class='mention' style='background:#ddeff2'>" + theMention + "</a>";
						content = content.join("");

						if (i === mentionMatch.length - 1) {
							_post.removeClass("not-treated");
						}
					}
				} else {
					setTimeout(function() {
						_post.removeClass("not-treated");
					}, 5000);
				}
				_article.html(content);
				callback(rootScope.post);
			}
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