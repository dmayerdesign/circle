function resizeAvatar(avatar, _) {
	_(avatar).parents(".avatar-container").imagefill();
	var _avatar = _(avatar);
	_avatar.css({
		height: "auto",
		width: "auto"
	});
	var avatarWidth = _avatar.width();
	var avatarHeight = _avatar.height();
	var _container = _avatar.parents(".avatar-container");
	var containerDimensions = {
		width: _container.width(),
		height: _container.height()
	};

	if ( avatarWidth > avatarHeight ) {
		var stretchDir = "height";
		var otherDir = "width";
		var marginDir = "top";
		var OGaspectRatio = avatarWidth/avatarHeight;
		var diff = containerDimensions.height - avatarHeight;
	} else {
		var stretchDir = "width";
		var otherDir = "height";
		var marginDir = "left";
		var OGaspectRatio = avatarHeight/avatarWidth;
		var diff = containerDimensions.width - avatarWidth;
	}

	var cssObj = {};
	cssObj[stretchDir] = containerDimensions[stretchDir];
	cssObj[otherDir] = containerDimensions[stretchDir] * OGaspectRatio;
	cssObj["margin-" + marginDir] = -(diff/2);
	
	_avatar.css(cssObj);
}

/**/
/** SOCK JS MESSAGING
/**/

// index.html
/**
<script src="http://cdn.sockjs.org/sockjs-0.3.min.js"></script>

<div class="message-box">
    <ul>
        <li ng-repeat="message in messages">{{message}}</li>
    </ul>

    <form ng-submit="sendMessage()">
        <input type="text" ng-model="messageText" placeholder="Type your message here" />
        <input type="submit" value="Send" />
    </form
</div>
**/

// main-controller.js
var sock = new SockJS('http://192.168.0.74:9999/chat');
$scope.messages = [];
$scope.sendMessage = function() {
    sock.send($scope.messageText);
    $scope.messageText = "";
};

sock.onmessage = function(e) {
    $scope.messages.push(e.data);
    $scope.$apply();
};


// server.js
var http = require('http');
var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer();
chat.on('connection', function(conn) {
    connections.push(conn);
    var number = connections.length;
    conn.write("Welcome, User " + number);
    conn.on('data', function(message) {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write("User " + number + " says: " + message);
        }
    });
    conn.on('close', function() {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write("User " + number + " has disconnected");
        }
    });
});

var server = http.createServer();
chat.installHandlers(server, {prefix:'/chat'});
server.listen(9999, '0.0.0.0');




		// $scope.infiniteScroll = function () {
		// 	var that = this;

		// 	setInterval(function() {
		// 		_(".posts-archive-container").scroll(function() {
		// 			var scrollTop = _(this).scrollTop();
		// 			var archiveHeight = _(this).height();

		// 			if ( scrollTop > archiveHeight + _(window).height() - 200 ) {
		// 				console.log( "scroll top: " + scrollTop );
		// 				that.postsAllowed.allow += 4;
		// 				console.log("allowed: " + that.postsAllowed.allow);
		// 			}
		// 		});
		// 	}, 1000);
		// };
		//$scope.infiniteScroll();



			// var verticallyCenter = setInterval(function() {
			// 	if ( _(".setup-form-container").length ) {
			// 		_(".setup-form-container").css({
			// 			top: (window.innerHeight / 3) + "px",
			// 			opacity: 1
			// 		});
			// 		clearInterval(verticallyCenter);
			// 	}
			// }, 500);



			

			// Post.find({circleId: req.query.circleId, type: "quest"})
			// .$where('this.quest.due < Date.now()')
			// .exec(function(err, questsPastDue) {
			// 	if (err) {
			// 		console.error(err);
			// 	} else {
			// 		for (var i = 0; i < questsPastDue.length; i++) {
			// 			Post.findOne({_id: questsPastDue[i]._id}, function(err, quest) {
			// 				if (err) {
			// 					console.error(err);
			// 				} else {
			// 					quest.status = "failed";
			// 					quest.save();
			// 				}
			// 			});
			// 		}
			// 	}
			// });




		$scope.customSelect = function customSelect(element, event, edit) {
			var _element = _(element);
			var str = this.newPost.tags;
			var _target = _(event.target);
			var tag = _target.data("option");
			var _customSelector = _target.parents(".select");
			var isSelected = _target.hasClass("selected");
			var appender = ", ";

			// if (edit) {
			// 	if ($rootScope.post.tags.indexOf(tag) === -1) {
			// 		$rootScope.post.tags.push(tag);
			// 	}
			// 	return;
			// }

			if (edit) {
				str = this.post.tags.toString();
			}

			if ( str && str.indexOf(",") > -1 ) {
				appender = ",";
			}
			if ( str && str.indexOf(" ") > -1 ) {
				appender = " ";
			}
			if ( str && str.indexOf(", ") > -1 ) {
				appender = ", ";
			}
			
			if ( !isSelected ) {
				_target.addClass("selected");
				if ( str && str.length && str.indexOf(tag) === -1 ) {
					str = str + appender + tag;
				}
				if ( !str || !str.length ) {
					str = tag;
				}
			} else {
				_target.removeClass("selected");
				if ( str && str.indexOf(appender) > -1 ) {
					str = str && str.replace(appender + tag, "");
				} else {
					str = str && str.replace(tag, "");
				}
			}

			this.newPost.tags = str;
			
			if (edit) {
				$rootScope.post.tags = str.split(splitter);
				var splitter = str.indexOf(",") > -1 ? "," : " ";
				splitter = str.indexOf(", ") > -1 ? ", " : splitter;
			}

			console.log(str);
			return str;
		};


		$scope.findUsersToMention = function() {
			var scope = this;
			var members = $rootScope.currentCircle.members;
			var content = scope.newPost.content;
			var tagPattern = /\@([^\s.,!?\-:\(\)]*)/gi;
			var match = content.match(tagPattern);

			console.log(match);

			if ( !match || !match.length || match[0].length < 2 ) {
				return;
			}

			console.log(scope.attemptMention);

			if ( members ) {
				scope.searchUsersToMention = true;
				scope.attemptMention = match[match.length - 1].replace("@", "");
			} else {
				scope.searchUsersToMention = false;
			}

			for ( var i = 0; i < members.length; i++ ) {
				if ( scope.attemptMention === members[i] ) {
					scope.searchUsersToMention = false;
				}
			}
		};

		$scope.mentionUser = function(username) {
			var scope = this;
			var content = scope.newPost.content;
			var tagPattern = /\@([^\s.,!?\-:\(\)]*)/gi;
			var match = content.match(tagPattern);
			var usernameFragment;
			for ( var i = 0; i < match.length; i++ ) {
				usernameFragment = match[i].replace("@", "");
				if ( username.indexOf(usernameFragment) > -1 ) {
					scope.newPost.content = content.replace(match[i], "@" + username + " ");
					scope.searchUsersToMention = false;
					_("#new_post_content").focus();
				}
			}
		};

		$scope.findTags = function(event, edit) {
			var scope = this;
			var _target = _(event.target);
			var tags = $rootScope.currentCircle.tags;
			var content = function() {
				if (!edit)
					return scope.newPost.tags;
				else
					return scope.post.tags.toString();
			}();
			var tagPattern = /\#([^\s,;]*)/gi;
			var match = content.match(tagPattern);

			scope.searchTagsToTag = match ? true : false;

			if ( !match || !match.length || match[0].length < 2 ) {
				return;
			}

			if ( tags ) {
				scope.attemptTag = match[match.length - 1].replace("#", "");
				console.log(scope.attemptTag);
			}

			for ( var i = 0; i < tags.length; i++ ) {
				if ( scope.attemptTag === tags[i] ) {
					scope.searchTagsToTag = false; // we got it, no need to keep showing suggestions
				}
			}
		};

		$scope.completeTag = function(tag, event) {
			var scope = this;
			var str = scope.newPost.tags;
			var _target = _(event).target;

			var isSelected = _target.hasClass("selected");
			var appender = ", ";

			if (edit) {
				str = this.post.tags.toString();
			}

			if ( str && str.indexOf(",") > -1 ) {
				appender = ",";
			}
			if ( str && str.indexOf(" ") > -1 ) {
				appender = " ";
			}
			if ( str && str.indexOf(", ") > -1 ) {
				appender = ", ";
			}
			
			if ( !isSelected ) {
				_target.addClass("selected");
				if ( str && str.length && str.indexOf(tag) === -1 ) {
					str = str + appender + tag;
				}
				if ( !str || !str.length ) {
					str = tag;
				}
			} else {
				_target.removeClass("selected");
				if ( str && str.indexOf(appender) > -1 ) {
					str = str && str.replace(appender + tag, "");
				} else {
					str = str && str.replace(tag, "");
				}
			}

			if (edit && Array.isArray(str)) {
				var splitter = str.indexOf(",") > -1 ? "," : " ";
				splitter = str.indexOf(", ") > -1 ? ", " : splitter;
				$rootScope.post.tags = str.split(splitter);
			} else {
				this.newPost.tags = str;
			}

			var tagPattern = /\#([^\s,;]*)/gi;
			var match = str.match(tagPattern);
			var tagFragment;
			for ( var i = 0; i < match.length; i++ ) {
				tagFragment = match[i].replace("#", "");
				if ( tag.indexOf(tagFragment) > -1 ) {
					scope.newPost.tags = str.replace(tagFragment, appender + tagFragment);
					scope.searchTagsToTag = false;
					_("#new_post_tags").focus();
				}
			}
		};


// INIT
		init.getUserAndCircle = function getUserAndCircle(id, code, callback) {
			if ( localStorage['Current-Circle'] && localStorage['User'] ) {
				if ( JSON.parse(localStorage['Current-Circle'])._id === id && JSON.parse(localStorage['User']).accessCodes.indexOf(code) > -1 ) {
					callback(JSON.parse(localStorage['User']), JSON.parse(localStorage['Current-Circle']));
					return;
				}
			}
			$http.get('api/users/getUser?userId=' + id).then(function(response) {
				var user = response.data;
				var circles = user.circles || null;
				if (circles && circles.undefined) { // if they somehow got past the access code duplicate validation
					localStorage.clear();
					$state.go('login');
					return;
				}
				localStorage.setItem('User', JSON.stringify(user));

				if ( user.circles && user.circles.length ) {
					console.log(user);

					var circles = user.circles;
					var accessCode = code || user.accessCodes[0];
					var accessAnswer = circles[accessCode] && circles[accessCode].accessAnswer;

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


		function initCircle(circle) {
			$scope.loggedIn = true;
			$scope.circle = circle;
			$rootScope.currentCircle = circle;
			$scope.circleName = circle.name;
			var circles = {};
			circles[circle.accessCode] = circle;
			localStorage.setItem('Circles', JSON.stringify(circles));
			$scope.circleJoined = true;
			$rootScope.circleJoined = true;
			$scope.showPostsTagged();

			$state.go('main');
		}

		function getCategories(scope, posts, callback) {
			var image, postToCheck;
			scope.categories = [];
			scope.tags = scope.currentCircle.tags;

			if ( scope.tags ) {
				for ( var i = 0; i < scope.tags.length; i++ ) {
					var tag = {};
					tag.name = scope.tags[i];


					for ( var j = 0; j < posts.length; j++ ) {
						postToCheck = posts[j];
						console.log(j);
						if ( postToCheck.tags.indexOf(tag.name) > -1 ) {

							if ( postToCheck.images.length ) {
								image = postToCheck.images[0];
							}
							else if ( postToCheck.linkEmbed && JSON.parse(postToCheck.linkEmbed).thumbnail_url ) {
								image = JSON.parse(postToCheck.linkEmbed).thumbnail_url;
							}
							
							if (image)
								tag.image = image;
							
							break;
						}
						else {
							tag.image = undefined;
							break;
						}
					}
					scope.categories.push(tag);
				}

				if (callback)
					callback(scope.categories);
			}
		}