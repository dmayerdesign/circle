(function(_) {
	angular.module('Circle')
	.controller('mainController', ['$scope', '$rootScope', '$state', '$stateParams', '$location', '$http', 'init', 'customizer', 'action', '$q', '$filter', 'Upload', 
						   					 function($scope,   $rootScope,   $state,   $stateParams,   $location,   $http,   init,   customizer,   action,   $q,   $filter,   Upload) {

		$rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
		$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']);
		if (!$rootScope.user) {
			$state.go('signup');
			return;
		}
		$rootScope.loggedIn = true;
		init.app($rootScope.user._id, false, function(user, circle) {
			$rootScope.user = user;
			if ( !$rootScope.user || !$rootScope.user.isEmailVerified ) {
				console.log("email is not verified");
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/#/verify-email?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail;
				}
				$scope.emailVerificationSent = true;
				$state.go('signup');
				return;
			}
			if (circle) {
				$rootScope.circleJoined = true;
				$rootScope.currentCircle = circle;

				init.getCircles(user.username, function(circles) {
					$rootScope.circles = circles;
				});
				init.getMembers(circle.accessCode, function(members) {
					$rootScope.users = members;
				});
				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					$scope.postsAllowed = {allow: 20};
					initUI(function() {
						$rootScope.drawersReady = true;
					});
					init.initFinal(_("body"));

					// Search for filter in query string
					if ( $location.search().tag ) {
						$scope.showPostsFiltered( 'tags', $location.search().tag );
						$http.get('api/tags/getTag?circleId=' + $rootScope.currentCircle._id + '&tagName=' + $location.search().tag).then(function(response) {
							$rootScope.archiveTag = response.data;
						});
						console.log($scope.postsAreFiltered);
					} else {
						$rootScope.archiveTag = null;
					}

					if ( $location.search().user ) {
						$scope.showPostsFiltered( 'users', $location.search().user );
					}

					if ( !$location.search() ) {
						$scope.showPostsFiltered();
						console.log($scope.postsAreFiltered);
					}

					// Check for new posts
					// setInterval(function() {
					// 	console.log($scope.postsAreFiltered.filter);
					// 	console.log($scope.postTypesAreFiltered.filter);

					// 	if ($scope.postsAreFiltered.filter || $scope.postTypesAreFiltered.filter || !$rootScope.currentCircle) // last one is if 'create or join a new circle' is clicked
					// 		return;
					// 	$scope.incomingPosts = false;
					// 	init.getPosts($rootScope.currentCircle._id, function(posts) {
					// 		$scope.incomingPosts = posts;
					// 		if ( $scope.incomingPosts && !$scope.postsAreFiltered.filter && !$scope.postTypesAreFiltered.filter ) {
					// 			$scope.difference = $scope.incomingPosts.length - $scope.posts.length;
					// 			if ( $scope.difference > 0 ) {
					// 				$scope.posts = posts;
					// 			}
					// 		}
					// 	});
					// }, 1000);
				});
				customizer.getStyle($rootScope);
			} else {
				$rootScope.circleJoined = false;
				$state.go('createCircle');
			}
		});



		$rootScope.editPost = false;

		$scope.postsAreFiltered = {};
		$scope.postTypesAreFiltered = {};

		$scope.postOrder = 'date';
		$scope.orderPosts = function(postOrder) {
			$scope.postOrder = postOrder;
		};

		$scope.newPost = {
			content: "",
			tags: [],
			quest: {
				worth: {
					achievement: {}
				}
			},
			poll: [],
			images: [],
			usersMentioned: []
		};

		$scope.upload = function(file) {
			var endpoint;
			var scope = this;

			if (file) {
				Upload.upload({
					url: 'api/post/attachImage',
					method: 'POST',
					data: {
						userId: $rootScope.user._id,
						circleId: $rootScope.currentCircle._id
					},
					file: file
				})
				.progress(function(e) {
					console.log("uploading");
					scope.uploadInProgress = true;
				})
				.success(function(res) {
					console.log(res.filePath);
					scope.newPost.images.push(res.filePath);
					scope.uploadInProgress = false;
				})
				.error(function(err) {
					console.error(err);
					scope.uploadInProgress = false;
				});
			}
		};
		
		$scope.sendPost = function(edit, event) {
			if ( event && event.keyCode !== 13 ) { return; }
			var that = edit ? $rootScope : this;
			if (edit) {
				that.newPost = that.post;
			}
			var content = that.newPost.content;
			var postLink = {};
			var linkPreview = that.linkPreview;
			var members = $rootScope.currentCircle.members;

			var tagPattern, mentionPattern, tagMatch, mentionMatch;
			var mentionsArr = [];

			if ( that.newPost.content.length <= 1 ) {
				return;
			}

			that.newPost.tags = [];

			tagPattern = /\#([^\s.,!?\-:\(\)]*)/gi;
			tagMatch = content.match(tagPattern);
			if (tagMatch) {
				for (var index = 0; index < tagMatch.length; index++) {
					that.newPost.tags[index] = tagMatch[index].replace("#", "");
				}
			}
			if (that.newPost.tags.length < 1)
				that.newPost.tags = ["random"];

			mentionPattern = /\@([^\s.,!?\-:\(\)]*)/gi;
			mentionMatch = content.match(mentionPattern);
			if (mentionMatch) {
				for (var index = 0; index < mentionMatch.length; index++) {
					mentionsArr[index] = mentionMatch[index].replace("@", "");
				}
			}
			that.newPost.usersMentioned = mentionsArr; // Array

			console.log(that.newPost.tags);
			console.log(that.newPost.usersMentioned);

			var request = {
				"authorName": $rootScope.user.name,
				"user": $rootScope.user.username || $rootScope.user.email,
				"userId": $rootScope.user._id,
				"avatar": $rootScope.user.avatar,
				"circleId": $rootScope.currentCircle._id,
				"content": that.newPost.content,
				"images": that.newPost.images,
				"type": that.newPost.type,
				"tags": that.newPost.tags,
				"quest": that.newPost.quest,
				"poll": that.newPost.poll,
				"usersMentioned": that.newPost.usersMentioned,
				"eventDate": that.newPost.eventDate,
				"eventLocation": that.newPost.eventLocation
			};

			if (edit) {
				request = that.newPost;
				$rootScope.post = request;
				console.log(request);
			}

			if ( linkPreview ) {
				postLink.url = linkPreview.url;
				postLink.thumbnail_url = linkPreview.thumbnail_url;
				postLink.title = linkPreview.title;
				postLink.description = linkPreview.description;
				postLink.provider_url = linkPreview.provider_url;
				postLink.type = linkPreview.type;

				var postImage;
				switch (postLink.type) {
					case "link":
						postImage = postLink.thumbnail_url;
					case "video":
						postImage = postLink.thumbnail_url;
					case "photo":
						postImage = postLink.url
					default:
						postImage = postLink.thumbnail_url;
				}

				if ( request.images.indexOf(postImage) === -1 ) {
					request.images.push(postImage);
				}

				request.linkEmbed = JSON.stringify(postLink);
			} else {
				request.linkEmbed = null;
			}

			$http.post('api/post/post', request)
			.success(function(response) {
				$scope.posts = response;

				if (edit) {
					$rootScope.editPost = false;
				}

				that.newPost = {
					content: "",
					tags: [],
					quest: {
						worth: {
							achievement: {}
						}
					},
					poll: [],
					images: [],
					usersMentioned: []
				};
				that.linkPreview = null;
				that.symbolSearch = {};
				_("#new-post-area > *").blur();
			})
			.error(function(err) {
				console.error(err);
			});

			var tagsArr = [];
			for ( var i = 0; i < that.newPost.tags.length; i++ ) {
				$http.post('api/tags/addTag', {
					name: that.newPost.tags[i],
					circleId: $rootScope.currentCircle._id
				}).then(function(response) {
					if ( response.data ) {
						$http.get('api/tags/get?circleId=' + $rootScope.currentCircle._id)
						.then(function(response) {
							var tags = response.data;
							for ( var i = 0; i < tags.length; i++ ) {
								if ( tags[i].hasOwnProperty("name") ) {
									tagsArr.push(tags[i].name);
								}
							}
							
							if ( i === that.newPost.tags.length - 1 ) {
								$rootScope.currentCircle.tags = tagsArr;
								$rootScope.currentCircle.tags = tagsArr;
							}
						});
					}
					
				});
			}

			if (edit) {
				window.location.reload(); // couldn't figure out how to get $rootScope to apply the changes, so a reload is the quick fix for now
			}
		};

		$scope.symbolSearch = {};

		$scope.findWithPrefixSymbol = function(edit) {
			var scope = this;
			var content = edit ? $rootScope.post.content : scope.newPost.content;
			var list, items, regex, match, symbol;

			// setTimeout(function() {
			// 	_(".post-search-list").each(function() {
			// 		var _this = _(this);
			// 		if ( !_this.find("li").length ) {
			// 			_this.hide().removeClass("list-active");
			// 		} else {
			// 			_this.show().addClass("list-active");
			// 		}
			// 	});
			// }, 300);

			if ( content.indexOf("@") > content.indexOf("#") ) {
				list = "members";
				symbol = "@";
				match = content.match(/\@([^\s.,!?\-:\(\)]*)/gi);
			}
			if ( content.indexOf("#") > content.indexOf("@") ) {
				list = "tags";
				symbol = "#";
				match = content.match(/\#([^\s.,!?\-:\(\)]*)/gi);
			}
			if ( content.indexOf("@") === -1 && content.indexOf("#") === -1 ) {
				match = false;
				return;
			}
			
			items = $rootScope.currentCircle[list];

			if ( !match || !match.length || match[match.length - 1].length < 2 ) { // if there's no symbol or nothing after the symbol
				scope.symbolSearch = {};
				return;
			}

			if ( items ) {
				scope.symbolSearch[list] = true;
				scope.attemptFind = match[match.length - 1].replace(symbol, "");
			} else {
				scope.symbolSearch[list] = false;
			}

			for ( var i = 0; i < items.length; i++ ) { // We found it - stop displaying the list
				if ( scope.attemptFind === items[i] ) {
					scope.symbolSearch[list] = false;
				}
			}
		};

		$scope.insertIntoPost = function(event, list, text, edit) {
			var scope = this;
			var content = edit ? $rootScope.post.content : scope.newPost.content;
			var fragment, match, symbol;

			if ( event.keyCode === 13 || event.target.className.indexOf("post-search-list-select") > -1 ) {

				if (list === "members") {
					match = content.match(/\@([^\s.,!?\-:\(\)]*)/gi);
					symbol = "@";
				}
				if (list === "tags") {
					match = content.match(/\#([^\s.,!?\-:\(\)]*)/gi);
					symbol = "#";
				}

				console.log(list);
				console.log(symbol);

				if (match) {
					fragment = match[match.length - 1].replace(symbol, "");
					if ( text.indexOf(fragment) > -1 ) {
						scope.newPost.content = content.replace(new RegExp(fragment + "$"), text + " ");
						scope.symbolSearch[list] = false;
						_("#new_post_content").focus();
					}
				}

				$rootScope.selectedFromList = null;
			}
		};

		$scope.selectFromList = function(event) {
			var scope = this;
			var selectObj = $rootScope.selectedFromList;
			var _firstInList = _(".list-active li").first();
			var _selected = _(".list-active li.selected");

			if (event.keyCode !== 40 && event.keyCode !== 38) {
				return false;
			}

			if (!selectObj) {
				selectObj = {};
				_firstInList.addClass("selected").siblings().removeClass("selected");
			} else {
				if (event.keyCode === 40) {
					_selected.removeClass("selected").next("li").addClass("selected");
					if ( !_selected.next("li").length ) {
						_firstInList.addClass("selected");
					}
				}
				if (event.keyCode === 38) {
					_selected.removeClass("selected").prev("li").addClass("selected");
					if ( !_selected.prev("li").length ) {
						selectObj = null;
						return;
					}
				}
			}

			if ( _(".list-active.post-search-list-members").length ) {
				selectObj.list = "members";
			}
			if ( _(".list-active.post-search-list-tags").length ) {
				selectObj.list = "tags";
			}
			selectObj.value = _(".list-active .selected").data("value");

			$rootScope.selectedFromList = selectObj;
			console.log(selectObj);
		};

		$scope.setNewPosts = function() {
			$scope.posts = angular.copy($scope.incomingPosts);
			$scope.incomingPosts = undefined;
		};

		$scope.showPostsFiltered = function(list, item) {
			var that = this;

			init.getPosts($rootScope.currentCircle._id, function(posts) {
				$scope.posts = posts;
				that.postsAllowed = {allow: 20};

				if ( !list || typeof list === 'undefined' ) {
					that.postsAreFiltered = {};
					$rootScope.archiveTag = null;
					$scope.postsAllowed = {allow: 20};
					return $scope.posts;
				} else {
					that.postsAreFiltered = {
						filter: list,
						term: item
					};

					console.log(that.postsAreFiltered);
					$scope.posts = function() {
						if (list === 'tags') {
							$location.search("tag", item);
							return $filter('filter')(that.posts, {tags: item});
						}
						if (list === 'users' && !that.filterByCreator) {
							$location.search("user", item);
							return $filter('filter')(that.posts, {usersMentioned: item});
						}
						if (list === 'users' && that.filterByCreator) {
							$location.search("user", item);
							return $filter('filter')(that.posts, {user: item});
						}
					}();
					return $scope.posts;
				}
			});
		};

		$scope.showPostsOfType = function(type) {
			var that = this;

			if ( $location.search() ) {
				window.location.href = "/#/";
				$rootScope.archiveTag = null;
			}

			init.getPosts($rootScope.currentCircle._id, function(posts) {
				$scope.posts = posts;
				that.postsAllowed = {allow: 20};

				if ( !that.postTypesAreFiltered || typeof that.postTypesAreFiltered === 'undefined' ) {
					that.postTypesAreFiltered = {};
				}

				if ( !type || typeof type === 'undefined' ) {
					that.postTypesAreFiltered = {};

					// clear query parameter if it exists
					if ( $location.search().tag || $location.search().user ) {
						window.location.href = "/#/";
					}

					return $scope.posts;
				} else {
					$scope.posts = $filter('filter')($scope.posts, {type: type});
					that.postTypesAreFiltered = {
						filter: "types",
						term: type
					};
					return $scope.posts;
				}
			});
		};

		$scope.applyFilterClasses = function() {
			if ( this.postTypesAreFiltered.filter && this.postsAreFiltered.filter ) {
				return this.postTypesAreFiltered.term + " " + this.postsAreFiltered.term;
			}
			if ( this.postsAreFiltered.filter ) {
				return this.postsAreFiltered.term;
			}
			if ( this.postTypesAreFiltered.filter ) {
				return this.postTypesAreFiltered.term;
			}
		};

		var initArchive = function() {
			var $head = _("head");
			var winHeight = _(window).height();
			var _archive = _(".posts-archive-container");

			_archive
				.css({height: (winHeight + 30) + "px"}) //.jScrollPane()
				.addClass("initiated");
		};
		var initArchiveInt = setInterval(function() {
			if ( !_(".posts-archive-container").hasClass("initiated") ) {
				initArchive();
				_(window).resize(initArchive);
			} else {
				clearInterval(initArchiveInt);
			}
		}, 200);

		$scope.showTagsDropdown = function() {
			$scope.tagsDropdownVisible = $scope.tagsDropdownVisible ? false : true;
		};

		$scope.resizeAvatar = function(avatar) {
			var _avatar = _(avatar);
			_avatar.css({
				height: auto,
				width: auto
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
				var marginDir = "top";
				var diff = containerDimensions.height - avatarHeight;
			} else {
				var stretchDir = "width";
				var marginDir = "left";
				var diff = containerDimensions.width - avatarWidth;
			}

			var cssObj = {};
			cssObj[stretchDir] = containerDimensions[stretchDir];
			cssObj["margin-" + marginDir] = -diff;
			
			_avatar.css(cssObj);
		};

		$scope.postsAllowed = {allow: 20};

		$scope.loadMore = function() {
			this.postsAllowed.allow += 20;
			console.log( this.postsAllowed );
		};

		$scope.generateLinkPreview = function(edit) {
			var that = edit ? $rootScope : this;
			var content = edit ? that.post.content : that.newPost.content;
			var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
			var urlMatch = new RegExp(urlPattern);
			var match = urlPattern.exec(content);
			var theLink;

			if ( match ) {
				theLink = match[0];
				console.log(theLink);

				_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
					console.log(data.thumbnail_url);
					console.log(data);

					if ( data.type === "photo" ) {
						data["src"] = data.url;
					} else {
						data["src"] = data.thumbnail_url;
					}

					that.linkPreview = data;
					console.log(that.linkPreview);
					console.log(edit);
				});
			} else {
				that.linkPreview = null;
			}
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
				});
			};
			initDrawers( _(".bottom-drawer"), _(".main-menu") );

			var initAddPost = function() {
				_("#post_type_regular").prop("checked", true);
			};
			initAddPost();

			if (callback)
				callback();
		}

		$scope.goToPost = function(post_id) {
			console.log(window.location.href);
			$state.go("single", {id: post_id});
		};

		$rootScope.archiveLinkPreviews = {};
		var treatPostLinksInt = setInterval(treatPostLinks, 200);
		setTimeout(function() {
			if (_(".post.not-treated").length < 1) {
				clearInterval(treatPostLinksInt);
			}
		}, 2000);
		function treatPostLinks() {
			var _posts = _(".post.not-treated");
			_posts.each(function() {
				var _post = _(this);
				var _article = _post.find("article");
				var content = _article.html();
				var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
				var match = content.match(urlPattern);
				var theLink;
				var postLinkData;

				if ( match ) {
					theLink = match[0];
					content = content.split(theLink); // get rid of the link
					content = content.join("");

					if ( _post.data("link-set") ) {
						setPostLinkData($scope, _post.data("link-set"));
					} else {
						_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
							setPostLinkData($scope, data);

							// use $http.post to set the post link if it didn't get set during the posting process
						});
					}

					function setPostLinkData($scope, data) {
						if ( data.type === "photo" || data.type === "video" ) {
							data.src = data.url;
						} else {
							data.src = data.thumbnail_url;
						}
						$rootScope.archiveLinkPreviews[_post.data("post-id")] = data;
						$scope.$apply();
					}

					_article.html(content);
				} else {
					$rootScope.archiveLinkPreviews[_post.data("post-id")] = null;
					$scope.$apply();
				}

				_post.removeClass("not-treated");
			});
		}

		$scope.tagsLimit = 5;

		$scope.clearNotification = function(all, id) {
			console.log(all);
			console.log(id);
			console.log(this.user._id);

			var scope = this;
			action.clearNotification(scope.user._id, all, id, function(user) {
				$rootScope.user.notifications = user.notifications;
				console.log(user);
			});
		};

		$rootScope.randomDismissal = function() {
			var index = Math.floor(Math.random() * 4);
			var dismissals = ["ok", "whatever", "fine", "cool"];
			console.log(dismissals[index]);
			return dismissals[index];
		}();

		$scope.checkQuest = function() {
			console.log(this.newPost.quest);
		};

	}]);
}(jQuery));