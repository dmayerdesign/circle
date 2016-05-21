var User = require('../datasets/users');
var Post = require('../datasets/posts');
var fs = require('fs-extra');
var path = require('path');

module.exports.updatePhoto = function(req, res) {
	var file = req.files.file,
		userId = req.body.userId;

	console.log("User " + userId + " is submitting " , file);

	var uploadDate = new Date().getTime();

	var tempPath = file.path;
	var targetPath = path.join(__dirname, "../../uploads/" + userId + "_" + uploadDate + "_" + file.name);
	var savePath = "/uploads/" + userId + "_" + uploadDate + "_" + file.name;

	fs.rename(tempPath, targetPath, function(err) {
		console.log(fs.rename);
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
	var userId = req.body.userId,
		fieldKey,
		fieldVal;

	if ( req.body.username ) {
		fieldKey = 'username';
		fieldVal = req.body.username;
	}
	if ( req.body.bio ) { 
		fieldKey = 'bio';
		fieldVal = req.body.bio;
	}
	if ( req.body.circles ) { 
		fieldKey = 'circles';
		fieldVal = req.body.circles;
	}

	User.findById(userId, function(err, userData) {
		var user = userData;

		if ( req.body.username ) {
			user.username = req.body.username;
		}
		if ( req.body.bio ) {
			user.bio = req.body.bio;
		}
		if ( req.body.circles && req.body.accessCode ) {
			user.circles = req.body.circles;
			user.accessCodes.push( req.body.accessCode );
		}

		user.save(function(err, userData) {
			if (err) {
				console.log("failed to update " + fieldKey);
				res.json({status: 500});
			} else {
				console.log("successfully updated the " + fieldKey + "!");
				Post.find({userId: userId}, function(err, posts) {
					for ( var i = 0; i < posts.length; i++ ) {
						posts[i].avatar = user.avatar;
						posts[i].user = user.username || user.email;
						posts[i].save();
					}
					res.json(userData);
				});
			}
		});
	});
};