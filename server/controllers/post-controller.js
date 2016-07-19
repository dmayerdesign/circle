var Post = require('../datasets/posts');
var Users = require('../datasets/users');
var mv = require('mv');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports.postPost = function(req, res) {
	console.log("POSTING: ");
	console.log(req.body);
	var post;
	if (req.body._id) { // if you're editing a post
		console.log("post exists!");
		Post.findById({_id: req.body._id}, function(err, post) {
			if (post)
				post.content = req.body.content;
				post.eventDate = req.body.eventDate;
				post.eventLocation = req.body.eventLocation,
				post.tags = req.body.tags;
				post.usersMentioned = req.body.usersMentioned;
				post.images = req.body.images;
				post.quest = req.body.quest;
				post.linkEmbed = req.body.linkEmbed;

				post.save(savePost);
				res.json(post);
			if (err)
				console.error(err);
		});
	} else {
		post = new Post(req.body);
		post.save(savePost);
	}

	function savePost(error, post) {
		if (error) {
			console.log("ERROR:");
			console.log(error);
		}
		else {
			console.log("SAVED POST");
			if (post.usersMentioned && post.usersMentioned.length && !req.body.edit) {
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

					/** NOTIFICATION **/
					if (mentionedUser !== post.user) {
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
									"circleId": post.circleId,
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
		}
	}

	if (!req.body._id) {
		Post.find({circleId: req.body.circleId})
		.sort({date: -1})
		.exec(function(err, allPosts) {
			if (err) {
				res.json(err);
			} else {
				res.json(allPosts);
			}
		});
	}
};

module.exports.postComment = function(req, res) {
	// comment, postId
	console.log("COMMENTING: ");
	console.log(req.body.comment);

	var comment = req.body.comment;

	Post.findOne({_id: req.body.postId}, function(err, post) {
		if (err) {
			console.error(err);
			res.json(err);
			return;
		} else {
			post.comments.push(comment);
			post.save(function(err, post) {
				var mentionedUser, notificationCopy;
				if (err) {
					console.error(err);
					res.json(err);
				} else {
					console.log("SAVED COMMENT");

					/** NOTIFICATION **/
					if (comment.user !== post.user) {
						Users.findOne({username: post.user}, function(err, user) {
							if ( err ) {
								console.log("couldn't find the author to notify them of the comment");
								console.error(err);
								return;
							}
							if ( user ) {
								if ( !user.notifications ) {
									user.notifications = [];
								}
								user.notifications.push({
									"circleId": post.circleId,
									"creator": comment.authorName || comment.user,
									"action": "commented on your post",
									"postId": post._id
								});
								user.save(function(err) {
									if (err) {
										console.error(err);
									} else {
										console.log("user notified of comment!");
										
										if (post.usersMentioned && post.usersMentioned.length) {
											commentedOnMention();
										}
									}
								});
							}
						});
					}

					if (comment.usersMentioned && comment.usersMentioned.length) {
						notificationCopy = "mentioned you in a comment";
						for (var i = 0; i < comment.usersMentioned.length; i++) {
							mentionedUser = comment.usersMentioned[i];

							/** NOTIFICATION **/
							if (mentionedUser !== comment.user) {
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
											"circleId": post.circleId,
											"creator": comment.authorName || comment.user,
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
					} else {
						commentedOnMention();
					}

					function commentedOnMention() {
						if (post.usersMentioned && post.usersMentioned.length) {
							notificationCopy = "commented on a post you're mentioned in";
							for (var j = 0; j < post.usersMentioned.length; j++) {
								mentionedUser = post.usersMentioned[j];

								if (mentionedUser !== comment.user) {
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
												"circleId": post.circleId,
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
					}

					res.json(post);
				}
			});
		}
	});
};

module.exports.deletePost = function(req, res) {
	Post.remove({circleId: req.body.circleId, _id: req.body.postId}, function(err, result) {
		if (err) {
			console.error(err);
		}
		Post.find({circleId: req.body.circleId})
		.sort({date: -1})
		.exec(function(err, allPosts) {
			if (err) {
				res.json(err);
			} else {
				res.json(allPosts);
			}
		});
	});
};

module.exports.deleteComment = function(req, res) {
	Post.findOne({_id: req.body.postId, circleId: req.body.circleId}, function(err, post) {
		if (err) {
			res.json(err);
		} else {
			post.comments.pull(req.body.commentId);
			post.save(function(err, post) {
				if (err) {
					res.json(err);
				} else {
					res.json(post);
				}
			});
		}
	});
};

module.exports.getPosts = function(req, res) {
	Post.find({circleId: req.query.circleId})
	.sort('-date')
	.exec(function(err, allPosts) {
		if (err) {
			res.json(err);
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
			res.json(err);
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
				if (post.quest.completers.indexOf(req.body.username) === -1 && !req.body.undo) {
					post.quest.completers.push(req.body.username);
				}
				if ( post.quest.completers.length === post.usersMentioned.length ) {
					post.quest.status = "completed";
				}
				if ( req.body.undo && post.quest.completers.indexOf(req.body.username) > -1 ) {
					post.quest.completers.splice(post.quest.completers.indexOf(req.body.username), 1);
					post.quest.status = req.body.undo.status;
				}
				post.save(function(err) {
					if (err) {
						console.error(err);
						res.json(err);
					} else {
						Users.findOne({username: req.body.username}, function(err, user) {
							if ( !req.body.undo ) {
								user.notifications.push({
									"circleId": post.circleId,
									"creator": post.authorName || post.user,
									"action": "said you completed this quest!",
									"postId": post._id
								});
							}
							if ( req.body.undo ) {
								user.notifications.push({
									"circleId": post.circleId,
									"creator": post.authorName || post.user,
									"action": "said you haven't completed this quest :(",
									"postId": post._id
								});
							}
							if ( post.quest.worth.currency && !req.body.undo ) {
								user.currency += post.quest.worth.currency;
							}
							if ( post.quest.worth.achievement && !req.body.undo ) {
								user.achievements.push(post.quest.worth.achievement);
							}
							if ( req.body.undo && post.quest.worth.currency ) {
								user.currency -= post.quest.worth.currency;
							}
							if ( req.body.undo && post.quest.worth.achievement ) {
								user.achievements.splice(user.achievements.indexOf(post.quest.worth.achievement), 1);
							}
							user.save(function(err) {
								if (!err) {
									res.json(post);
								} else {
									console.error(err);
									res.json(err);
								}
							});
						});
					}
				});
			}
			else {
				console.error(err);
				res.json(err);
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
			res.json(err);
		} else {
			console.log( allPosts );
			res.json(allPosts);
		}
	});
};

module.exports.getPost = function(req, res) {
	if ( !req.query.id || !req.query.circleId ) {
		console.err("Couldn't get the post");
		res.json({status: 500})
		return;
	}
	Post.findOne({_id: req.query.id, circleId: req.query.circleId}, function(err, post) {
		if (err) {
			res.json(err);
		} else {
			console.log( post );
			res.json(post);
		}
	});
};

module.exports.updatePostUser = function(req, res) {
	Post.findOne({_id: req.body.postId}, function(err, post) {
		if (err) {
			res.json(err);
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
	console.log(req.files);
	console.log(req.body);
	var file = req.files && req.files.file,
		userId = req.body.userId,
		circleId = req.body.circleId;

	if (req.body.linkedImageURI && !file) {
		res.json({
			filePath: req.body.linkedImageURI
		});
		return;
	}
	else {
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

			mv(tempPath, targetPath, function(err) {
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
	}
};

module.exports.removeImage = function(req, res) {
	var postId = req.body.postId;
	var imgPath = req.body.path;

	Post.findById(postId, function(err, post) {
		if (err) {
			console.error(err);
			res.json({status: 500});
		} else {
			post.images.splice(post.images.indexOf(imgPath), 1);
			post.save(function(error, post) {
				if (error) {
					console.error(error);
					res.json({status: 500});
				} else {
					console.log("deleted image " + imgPath);
					res.json(post.images);
				}
			});
		}
	});
};

module.exports.castPollVote = function(req, res) {
	var postId = req.body.postId;
	var pollChoice = req.body.choice;
	var voter = req.body.voter;
	var poll;

	Post.findById(postId, function(err, post) {
		if (err) {
			console.error(err);
			res.json({status: 500});
		} else {
			for (var i = 0; i < post.poll.length; i++) {
				poll = post.poll[i];

				if (poll.choice === pollChoice) {
					if (poll.voters.indexOf(voter) > -1) {
						poll.voters.splice(poll.voters.indexOf(voter), 1);
						poll.votes -= 1;
					} else {
						poll.votes += 1;
						poll.voters.push(voter);
					}
				}
			}
			post.save(function(error, post) {
				if (error) {
					console.error(error);
					res.json(error);
				} else {
					console.log("Poll vote cast by " + voter + "!");
					res.json(post.poll);
				}
			});
		}
	});
};

module.exports.react = function(req, res) {
	var postId = req.body.postId;
	var username = req.body.username;
	var name = req.body.name;
	var commentId = req.body.commentId;
	var reaction = req.body.reaction;
	var returnAllPosts = req.body.allPosts;
	var isPost = !commentId ? true : false;
	var isComment = commentId ? true: false;
	var undo = false;
	var theComment;
	var thing = isComment ? "comment" : "post";

	Post.findById(postId, function(err, post) {
		var userToNotify = (thing === "post") ? post.user : req.body.commenter;

		if (err) {
			console.error(err);
			res.json({status: 500});
		} else {
			if (isPost) {
				if (post.reactions[reaction].users.indexOf(username) > -1) {
					post.reactions[reaction].users.splice(post.reactions[reaction].users.indexOf(username), 1);
					undo = true;
				}
				if (!undo) {
					post.reactions[reaction].amount += 1;
					post.reactions[reaction].users.push(username);
				} else {
					post.reactions[reaction].amount -= 1;
				}
			}
			if (isComment) {
				theComment = post.comments.id(commentId);
				if (theComment.reactions[reaction].users.indexOf(username) > -1) {
					theComment.reactions[reaction].users.splice(theComment.reactions[reaction].users.indexOf(username), 1);
					undo = true;
				}
				if (!undo) {
					theComment.reactions[reaction].amount += 1;
					theComment.reactions[reaction].users.push(username);
				} else {
					theComment.reactions[reaction].amount -= 1;
				}
			}
			post.save(function(err, post) {
				if (err) {
					console.error(err);
					res.json(err);
				} else {
					if (!undo && userToNotify !== username) {
						Users.findOne({username: userToNotify}, function(err, user) {
							if ( err ) {
								console.log("couldn't find the user to notify them of the reaction");
								console.error(err);
								return;
							}
							if ( user ) {
								if ( !user.notifications ) {
									user.notifications = [];
								}
								user.notifications.push({
									"circleId": post.circleId,
									"creator": name || username,
									"action": reaction + "s your " + thing,
									"postId": post._id
								});
								user.save(function(err) {
									if (err) {
										console.error(err);
									} else {
										console.log("user notified of the reaction on their " + thing + "!");
									}
								});
							}
						});
					}
					if (!returnAllPosts) {
						res.json(post);
					} else {
						Post.find({}).exec(function(err, allPosts) {
							if (err) {
								res.json(err);
							} else {
								res.json(allPosts);
							}
						});
					}
				}
			});
		}
	});
};