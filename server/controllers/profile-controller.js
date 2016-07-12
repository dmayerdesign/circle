var User = require('../datasets/users');
var Post = require('../datasets/posts');
var mv = require('mv');
var path = require('path');

module.exports.updatePhoto = function(req, res) {
	var file = req.files.file,
		userId = req.body.userId;

	console.log("User " + userId + " is submitting " , file);

	var uploadDate = new Date().getTime();

	var tempPath = file.path;
	var targetPath = path.join(__dirname, "../../uploads/" + userId + "_" + uploadDate + "_" + file.name);
	var savePath = "/uploads/" + userId + "_" + uploadDate + "_" + file.name;

	mv(tempPath, targetPath, function(err) {
		if (err) {
			console.log(err);
		} else {
			User.findById(userId, function(err, user) {
				user.avatar = savePath;
				user.save(function(err, userData) {
					if (err) {
						console.log("Save failed :(");
						res.json({status: 500});
					} else {
						console.log("Save successful! ^_^");
						Post.find({userId: userId}, function(err, posts) {
							for ( var i = 0; i < posts.length; i++ ) {
								posts[i].avatar = user.avatar;
								posts[i].user = user.username || user.email;
								posts[i].save();
								console.log(posts[i].avatar);
							}
							res.json(userData);
						});
					}
				})
			});
		}
	});
};

module.exports.editProfile = function(req, res) {
	var userId = req.body._id;

	User.findById(userId, function(err, userData) {
		var user = userData;
		user.username = req.body.username;
		user.bio = req.body.bio;
		user.accessCodes = req.body.accessCodes;
		user.name = req.body.name;

		user.save(function(err, userData) {
			if (err) {
				console.log("failed to update profile");
				res.json({status: 500});
			} else {
				console.log("successfully updated the user!");
				Post.find({userId: userId}, function(err, posts) {
					for ( var i = 0; i < posts.length; i++ ) {
						posts[i].avatar = user.avatar;
						posts[i].user = user.username;
						posts[i].authorName = user.name || user.username;
						posts[i].save();
					}
				});
				Post.find({'comments.userId': userId}, function(err, posts) {
					for ( var i = 0; i < posts.length; i++ ) {
						for ( var index = 0; index < posts[i].comments.length; index++ ) {
							posts[i].comments[index].avatar = user.avatar;
							posts[i].comments[index].user = user.username;
							posts[i].comments[index].authorName = user.name || user.username;
							posts[i].save();
						}
					}
				});
				res.json(userData);
			}
		});
	});
};