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
			if (post.usersTagged && post.usersTagged.length) {
				for (var i = 0; i < post.usersTagged.length; i++) {
					var taggedUser = post.usersTagged[i];
					Users.findOne({username: taggedUser}, function(err, user) {
						if ( err ) {
							console.log("couldn't find the user to notify them of the tag");
							console.error(err);
							res.json({status: 500});
							return;
						}
						if ( user ) {
							if ( !user.notifications ) {
								user.notifications = [];
							}
							user.notifications.push({
								"creator": post.user,
								"action": "mentioned you in a post",
								"postId": post._id
							});
							user.save(function(err) {
								if (err) {
									console.error(err);
								} else {
									console.log("user notified of tag!");
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
			//console.log( allPosts );
			res.json(allPosts);
		}
	});
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