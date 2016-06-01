var Post = require('../datasets/posts');
var Users = require('../datasets/users');
var fs = require('fs-extra');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports.postPost = function(req, res) {
	console.log("POSTING: ");
	console.log(req.body);
	var post = new Post(req.body);
	post.save(function(error, post) {
		if (error) {
			console.log("ERROR:");
			console.log(error);
		} else {
			console.log("SAVED POST");
			if (post.usersMentioned && post.usersMentioned.length) {
				for (var i = 0; i < post.usersMentioned.length; i++) {
					var mentionedUser = post.usersMentioned[i];
					var notificationCopy;

					switch (post.type) {
						case "normal":
							notificationCopy = "mentioned you in a post";
							break;
						case "event":
							notificationCopy = "invited you to an event";
							break;
						case "quest":
							notificationCopy = "sent you on a quest!";
							break;
					};

					Users.findOne({username: mentionedUser}, function(err, user) {
						if ( err ) {
							console.log("couldn't find the user to notify them of the mention");
							console.error(err);
							return;
						}
						if ( user ) {
							if ( !user.notifications ) {
								user.notifications = [];
							}
							user.notifications.push({
								"creator": post.authorName || post.user,
								"action": notificationCopy,
								"postId": post._id
							});
							user.save(function(err) {
								if (err) {
									console.error(err);
								} else {
									console.log("user notified of mention!");
								}
							});
						}
					});
				}
			}
		}
	});

	Post.find({circleId: req.body.circleId})
	.sort({date: -1})
	.exec(function(err, allPosts) {
		if (err) {
			res.error(err);
		} else {
			res.json(allPosts);
		}
	});
};

module.exports.postComment = function(req, res) {
	// comment, postId
	console.log("COMMENTING: ");
	console.log(req.body.comment);

	var comment = req.body.comment;

	Post.findOne({_id: req.body.postId}, function(err, post) {
		if (err) {
			console.error(err);
			res.error(err);
			return;
		} else {
			post.comments.push(comment);
			post.save(function(err, post) {
				var mentionedUser, notificationCopy;
				if (err) {
					console.error(err);
					res.error(err);
				} else {
					console.log("SAVED COMMENT");
					if (comment.usersMentioned && comment.usersMentioned.length) {
						notificationCopy = "mentioned you in a comment";
						for (var i = 0; i < comment.usersMentioned.length; i++) {
							mentionedUser = comment.usersMentioned[i];

							Users.findOne({username: mentionedUser}, function(err, user) {
								if ( err ) {
									console.log("couldn't find the user to notify them of the mention");
									console.error(err);
									return;
								}
								if ( user ) {
									if ( !user.notifications ) {
										user.notifications = [];
									}
									user.notifications.push({
										"creator": comment.authorName || comment.user,
										"action": notificationCopy,
										"postId": post._id
									});
									user.save(function(err) {
										if (err) {
											console.error(err);
										} else {
											console.log("user notified of mention!");
											commentedOnMention();
										}
									});
								}
							});
						}
					} else {
						commentedOnMention();
					}

					function commentedOnMention() {
						if (post.usersMentioned && post.usersMentioned.length) {
							notificationCopy = "commented on a post you're mentioned in";
							for (var j = 0; j < post.usersMentioned.length; j++) {
								mentionedUser = post.usersMentioned[j];

								Users.findOne({username: mentionedUser}, function(err, user) {
									if ( err ) {
										console.log("couldn't find the user to notify them of the comment");
										console.error(err);
										return;
									}
									if ( user ) {
										if ( !user.notifications ) {
											user.notifications = [];
										}
										user.notifications.push({
											"creator": comment.authorName || comment.user,
											"action": notificationCopy,
											"postId": post._id
										});
										user.save(function(err) {
											if (err) {
												console.error(err);
											} else {
												console.log("user notified of comment!");
											}
										});
									}
								});
							}
						}
					}

					res.json(post);
				}
			});
		}
	});
};

module.exports.deletePost = function(req, res) {
	Post.remove({circleId: req.body.circleId, _id: req.body.postId}, function(err, posts) {
		console.log("post deleted: " + posts);
		console.log("circleId: " + req.body.circleId + ", " + "postId: " + req.body.postId);
	});

	Post.find({circleId: req.body.circleId})
	.sort({date: -1})
	.exec(function(err, allPosts) {
		if (err) {
			res.error(err);
		} else {
			res.json(allPosts);
		}
	});
};

module.exports.getPosts = function(req, res) {
	Post.find({circleId: req.query.circleId})
	.sort({date: -1})
	.exec(function(err, allPosts) {
		if (err) {
			res.error(err);
		} else {
			for (var i = 0; i < allPosts.length; i++) {
				if (allPosts[i].type == "quest" && allPosts[i].quest.due < Date.now() && allPosts[i].quest.status === "in_progress") {
					Post.findOne({_id: allPosts[i]._id}, function(err, quest) {
						if (err) {
							console.error(err);
						} else {
							quest.status = "failed";
							quest.save();
						}
					});
				}
			}

			res.json(allPosts);
		}
	});
};

module.exports.updateQuestStatus = function(req, res) {
	Post.findOne({_id: req.body.postId}, function(err, post) {
		if (err) {
			res.error(err);
		}
		else if (req.body.status !== "in_progress" && req.body.status !== "completed" && req.body.status !== "failed") {
			console.error("didn't recognize the new status");
			res.json({status: 200});
		}
		else if (post) {
			post.quest.status = req.body.status;
			post.save();
			res.json(post);
		}
	});
};

module.exports.userCompletedQuest = function(req, res) {
	// username, postId
	if ( req.body.postId && req.body.username ) {
		Post.findOne({_id: req.body.postId}, function(err, post) {
			if (!err && post.type === "quest") {
				if (post.quest.completers.indexOf(req.body.username) === -1) {
					post.quest.completers.push(req.body.username);
				}
				if ( post.quest.completers.length === post.usersMentioned.length ) {
					post.quest.status = "completed";
				}
				post.save(function(err) {
					if (err) {
						console.error(err);
						res.error(err);
					} else {
						Users.findOne({username: req.body.username}, function(err, user) {
							if ( post.quest.worth.currency ) {
								user.currency += post.quest.worth.currency;
							}
							if ( post.quest.worth.achievement ) {
								user.achievements.push(post.quest.worth.achievement);
							}
							user.save(function(err) {
								if (!err) {
									res.json(post);
								} else {
									console.error(err);
									res.error(err);
								}
							});
						});
					}
				});
			}
			else {
				console.error(err);
				res.error(err);
			}
		});
	} else {
		console.error("you didn't provide enough data in the POST request");
		res.json({status:500});
	}
};

module.exports.getPostsByTag = function(req, res) {
	Post.find({circleId: req.query.circleId, tags: req.query.tag})
	.sort({date: -1})
	.exec(function(err, allPosts) {
		if (err) {
			res.error(err);
		} else {
			console.log( allPosts );
			res.json(allPosts);
		}
	});
};

module.exports.getPost = function(req, res) {
	if ( !req.query.id ) { return; }
	Post.findOne({_id: req.query.id}, function(err, post) {
		if (err) {
			res.error(err);
		} else {
			console.log( post );
			res.json(post);
		}
	});
};

module.exports.updatePostUser = function(req, res) {
	Post.findOne({_id: req.body.postId}, function(err, post) {
		if (err) {
			res.error(err);
		} else if (post) {
			console.log("post: " + post);
			post.user = req.body.username;
			post.avatar = req.body.avatar;
			post.save();
			res.json(post);
		}
	});
};

module.exports.attachImage = function(req, res) {
	var file = req.files.file,
		userId = req.body.userId,
		circleId = req.body.circleId;

	console.log("User " + userId + " is submitting " , file);

	var uploadDate = new Date().getTime();

	mkdirp( path.join(__dirname, "../../uploads/" + circleId), function(err) {

		if (err) {
			console.log("couldn't create the circle directory in uploads");
			return;
		}
		
		var tempPath = file.path;
		var targetPath = path.join(__dirname, "../../uploads/" + circleId + "/" + userId + "_" + uploadDate + "_" + file.name);
		var savePath = "/uploads/" + circleId + "/" + userId + "_" + uploadDate + "_" + file.name;

		fs.rename(tempPath, targetPath, function(err) {
			if (err) {
				console.log(err);
				res.json({status: 500});
			} else {
				res.json({
					filePath: savePath
				});
			}
		});
	});
};