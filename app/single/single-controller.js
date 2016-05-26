(function(_) {
	angular.module('Circle')
	.controller('singleController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 
													function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init) {
		console.log( $stateParams );

		$rootScope.currentState = 'single';

		/**/
		/** INITIALIZE THE USER
		/**/
		if ( localStorage['User'] ) {
			var localUser = JSON.parse(localStorage['User']);
			if ( localUser.email ) {
				$rootScope.user = localUser;
			}
		}
		if ( !$scope.user || !$scope.user._id ) {
			$state.go('login');
			return;
		} else {
			$scope.loggedIn = true;
		}
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
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail + "/#/verify-email";
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
					treatPostLink();
				});
			} else {
				$scope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		var postId = $stateParams.id;
		console.log( postId );


		/**									 **/
		/** INIT single post **/
		/**									 **/

		getPost($scope, postId);

		function getPost($scope, id) {
			$http.get('api/post/getSingle?id=' + id)
			.then(function(response) {
				$scope.post = response.data;
				$scope.post.image = $scope.post.images[0];
				console.log("has images");
				if ( $scope.post.linkEmbed ) {
					console.log("has thumbnail");
					$scope.post.image = JSON.parse($scope.post.linkEmbed).thumbnail_url;
					if ( JSON.parse($scope.post.linkEmbed).type === "photo" ) {
						console.log("has photo");
						$scope.post.image = JSON.parse($scope.post.linkEmbed).url;
					}
				}
				
				console.log( $scope.post );
			});
		}

		$scope.deletePost = function(postId) {
			var that = this;
			var request = {
				postId: postId,
				circleId: $rootScope.currentCircle._id
			};
			console.log(request);
			$http.post('api/post/delete', request).then(function(response) {
				that.posts = response.data;
				$state.go('main');
			});
		};

		$scope.deletePostClicked = false;
		$scope.deletePostClick = function(click) {
			console.log(click);
			if (click === 'try') {
				$scope.deletePostClicked = true;
			}
			else if (click === 'cancel') {
				$scope.deletePostClicked = false;
			}
			console.log( $scope.deletePostClicked );
		};

		$scope.linkPreview = null;
		function treatPostLink() {
			var _post = _("#post");
			var _article = _post.find("article");
			var content = _article.html();
			var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
			var urlMatch = new RegExp(urlPattern);
			var match = urlPattern.exec(content);
			var theLink;

			if ( match ) {
				theLink = match[0];
				content = content.split(theLink);

				content[0] += "<a href='" + theLink + "' target='_blank' title='" + "'>" + theLink + "</a>";
				content[1] = "";
				content = content.join("");


				_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
					console.log(data);
					$scope.linkPreview = data;
				});
			} else {
				$scope.linkPreview = null;
			}

			_post.removeClass("not-treated");
			_article.html(content);
		};

	}]);
}(jQuery));