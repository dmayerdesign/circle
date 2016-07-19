(function(_) {
	var app = angular.module('Circle', ['ui.router', 'ngFileUpload', 'ngAnimate']);
	
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
			url: "/single/:id?tag",
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
		.state('members', {
			url: "/members",
			templateUrl: "app/members/members.html",
			controller: "membersController"
		})
	});


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

		init.getCirclesFromAccessCodes = function(accessCodes, callback) {
			var circles = {};
			accessCodes.forEach(function(accessCode, index, codes) {
				$http.get('api/circle/get?accessCode=' + accessCode).then(function(response) {
					var circle = response.data;

					circles[accessCode] = circle;
					localStorage.setItem('Circles', JSON.stringify(circles));

					console.log(circles);
					if (callback && index === (codes.length - 1))
						callback(circles);
				});
			});
		};

		init.app = function(userId, accessCode, callback) {
			var that = this;
			var localCode = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']).accessCode;
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
					_id: user._id,
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
					response.data.forEach(function(post, index, posts) {
						if (post.comments) {
							var comments = post.comments;
							var commenter;
							var isDup;

							post.commenters = [];
							comments.forEach(function(comment) {
								commenter = {};
								commenter.authorName = comment.authorName;
								commenter.user = comment.user;
								commenter.avatar = comment.avatar;

								post.commenters.forEach(function(test) {
									 if (test.user == commenter.user) {
									 	isDup = true;
									 }
								});
								if (!isDup) {
									post.commenters.push(commenter);
								}
							});
							posts[index] = post;
						}
					});
					callback(response.data);
				}
				_(".checked-for-tag").removeClass("checked-for-tag");
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

		init.getCircles = function(username, callback) {
			$http.get('api/circles/get?username=' + username)
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

		init.title = function(params) {
			var titleBlink = false;
			var i = 0;
			if (params.name) {
				titleBlink = setInterval(function() {
					if (i%2 && !params.notifications) {
						_("title").html(params.name);
					}
					else if (!document.hasFocus() && params.notifications) {
						if (i%2)
							_("title").html("You've got " + params.notifications + " notifications");
						else
							_("title").html("in " + params.name);
					}
					else if (params.notifications) {
						_("title").html("(" + params.notifications + ") " + params.name);
					}
					else {
						_("title").html(params.name);
					}
					i++;
				}, 3000);
			}
		};

		return init;
	});

	app.factory('action', function($http, $state) {
		var action = {};

		action.getUser = function(userId, callback) {
			$http.get('api/users/getUser?userId=' + userId).then(function(response) {
				if (callback)
					callback(response.data);
			});
		};

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
			var i = 0;
			var treatPostInt = setInterval(function() {
				_(".state-single .not-treated").each(function(i) {
					var _element = _(".state-single .not-treated");
					treatLink(_element.eq(i), scope, rootScope, function(content) {
						treatTags(_element.eq(i), scope, rootScope, content, function(content) {
							treatMentions(_element.eq(i), scope, rootScope, content, function(post) {
								console.log(_element.eq(i));
								if (callback)
									callback(post);
							});
						});
					});
				});
				if ( i >= 100 ) {
					clearInterval(treatPostInt);
				}
				i++;
			}, 100);

			function treatLink(_element, scope, rootScope, callback) {
				var content = _element.text();
				var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
				var match = urlPattern.exec(content);
				var theLink;

				if ( match ) {
					theLink = match[0];
					content = content.split(theLink);

					content[0] += "<a href='" + theLink + "' target='_blank'>" + theLink + "</a>";
					content = content.join("");

					if ( !rootScope.post.linkEmbed && _element.is("article") ) {
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

				_element.removeClass("not-treated");
			}

			function treatTags(_element, scope, rootScope, content, callback) {
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
							_element.removeClass("not-treated");
						}
					}
				} else {
					setTimeout(function() {
						_element.removeClass("not-treated");
					}, 5000);
				}

				callback(content);
			}

			function treatMentions(_element, scope, rootScope, content, callback) {
				var mentionPattern = /\@([^\s.,!?\-:\(\)]*)/gi;
				var mentionMatch = content.match(mentionPattern);
				var theMention, i, userExists;

				if ( mentionMatch && mentionMatch.length ) {
					for (i = 0; i < mentionMatch.length; i++) {
						theMention = mentionMatch[i];

						rootScope.users.forEach(function(member) {
							if (theMention.replace("@", "") == member.username) {
								userExists = true;
							}
						});

						if (!userExists) {
							continue;
						}

						content = content.split(theMention);
						content[0] += "<a href='/#/?user=" + theMention.replace("@", "") + "' class='mention'>" + theMention + "</a>";
						content = content.join("");

						if (i === mentionMatch.length - 1) {
							_element.removeClass("not-treated");
						}
					}
				} else {
					setTimeout(function() {
						_element.removeClass("not-treated");
					}, 5000);
				}
				_element.html(content);
				callback(rootScope.post);
			}
		};

		action.react = function($event, reaction, type, id, commentId, commenter, user, circleId, callback, returnAllPosts) {
			var _thisBtn = _($event.target).is("button") ? _($event.target) : _($event.target).parents("button");
			var _thisIcon = _thisBtn.find("i");
			var _newIcon;

			var request = {
				circleId: circleId,
				postId: id,
				commentId: (type === "comment") ? commentId : null,
				commenter: commenter,
				username: user.username,
				name: user.name,
				reaction: reaction,
				allPosts: returnAllPosts
			};
			console.log(request);
			$http.post('api/post/react', request).then(function(response) {
				if (callback) {
					callback(response.data);
				}
			});

			if (_thisBtn.parents(".comment").length) {
				return;
			}
			if (!_thisBtn.hasClass("liked-by-you") && !_thisBtn.hasClass("loved-by-you")) {
				_newIcon = _thisIcon.clone();
				_newIcon.insertAfter(_thisIcon).addClass("copy");
				console.log(_thisIcon);
				TweenMax.to(_newIcon, 0.6, {
					y: -30,
					scale: 1.3,
					opacity: 0,
					onComplete: destroyCopy,
					onCompleteParams: [_newIcon]
				});

				function destroyCopy(_copy) {
					_copy.remove();
				}
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

			var fontLink;
			if ( $scope.currentCircle.styles.font === "quicksand" && !jQuery(".quicksand-link").length ) { fontLink = "<link class='font-link quicksand-link' href='https://fonts.googleapis.com/css?family=Quicksand:300,400,700' rel='stylesheet' type='text/css'>"; }
			if ( $scope.currentCircle.styles.font === "roboto" && !jQuery(".roboto-link").length ) { fontLink = "<link class='font-link roboto-link' href='https://fonts.googleapis.com/css?family=Roboto:300,400,700' rel='stylesheet' type='text/css'>"; }
			if ( $scope.currentCircle.styles.font === "open-sans" && !jQuery(".open-sans-link").length ) { fontLink = "<link class='font-link open-sans-link' href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,700,700italic' rel='stylesheet' type='text/css'>"; }
			if ( $scope.currentCircle.styles.font === "montserrat" && !jQuery(".montserrat-link").length ) { fontLink = "<link class='font-link montserrat-link' href='https://fonts.googleapis.com/css?family=Montserrat:400,700' rel='stylesheet' type='text/css'>"; }
			if ( $scope.currentCircle.styles.font === "pridi" && !jQuery(".pridi-link").length ) { fontLink = "<link class='font-link pridi-link' href='https://fonts.googleapis.com/css?family=Pridi:300,400,700' rel='stylesheet' type='text/css'>"; }
			if ( $scope.currentCircle.styles.font === "helvetica" && _(".font-link").length ) { fontLink = ""; _(".font-link").remove(); }
			_("head").append(fontLink);

			return $scope;
		};

		return customizer;
	});

	app.factory('generate', function() {
		var generate = {};
		generate.randomInteger = function(n, floor) {
			var func = floor || 'ceil';
			return Math[func](Math.random()*n);
		};

		return generate;
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

	app.directive('toggleClass', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('click', function() {
        	var wasToggled = _(element).hasClass(attrs.toggleClass);
        	_("." + attrs.toggleClass).removeClass(attrs.toggleClass);
          if (!wasToggled) {
          	element.toggleClass(attrs.toggleClass);
          }
        });
      }
    };
	});

	app.directive('stickyToggleClass', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('click', function() {
        	if (!element.hasClass(attrs.stickyToggleClass)) {
        		element.parent().parent().parent().find("." + attrs.stickyToggleClass).removeClass(attrs.stickyToggleClass);
          	element.addClass(attrs.stickyToggleClass);
        	}
        });
      }
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

	app.directive('focusIf', function($timeout, $parse) {
	  return {
	    //scope: true,   // optionally create a child scope
	    link: function(scope, element, attrs) {
	      var model = $parse(attrs.focusIf);
	      scope.$watch(model, function(value) {
	        console.log('value=',value);
	        if(value === true) { 
	          $timeout(function() {
	            element[0].focus(); 
	          });
	        }
	      });
	      // to address @blesh's comment, set attribute value to 'false'
	      // on blur event:
	      element.bind('blur', function() {
					console.log('blur');
					$timeout(function() {
						scope.$apply(model.assign(scope, false));
					}, 300);
	      });
	    }
	  };
	});

}(jQuery));