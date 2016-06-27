var Tag = require('../datasets/tags');
var Circle = require('../datasets/circles');
var Post = require('../datasets/posts');
var mv = require('mv');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports.addTag = function(req, res) {
	Tag.find(req.body, function(err, tags) {
		if ( err ) {
			res.error(err);
		}
		if ( tags.length ) {
			res.json({tagExists: true});
			return;
		} else {
			var tag = new Tag({
				name: req.body.name,
				circleId: req.body.circleId
			});

			tag.save(function(error, tag) {
				Circle.findById(req.body.circleId, function(err, circle) {
					if ( err ) {
						res.error(err);
					}
					if ( circle ) {
						circle.tags.push(req.body.name);
						circle.save();
					}
				});

				res.json(tag);
			});
		}
	});
};

module.exports.deleteTag = function(req, res) {
	Tag.remove({circleId: req.body.circleId, name: req.body.tagName}, function(err, result) {
		if (err) {
			console.error(err);
		} else {
			Circle.findById(req.body.circleId, function(err, circle) {
				if (err) {
					console.error(err);
				} else {
					circle.tags.splice(circle.tags.indexOf(req.body.tagName), 1);
					circle.save(function(err) {
						if (err) {
							console.error(err);
							res.json({status: 500});
						} else {
							Post.find({tags: req.body.tagName}, function(err, posts) {
								for ( var i = 0; i < posts.length; i++ ) {
									posts[i].tags.splice(posts[i].tags.indexOf(req.body.tagName), 1);
									posts[i].save(function(err) {
										if (err) {
											console.error(err);
										}
									});
								}
							});

							res.json(circle.tags);
						}
					});
				}
			});
		}
		
	});
};

module.exports.getTags = function(req, res) {
	Tag.find({circleId: req.query.circleId})
	.sort({date: -1})
	.exec(function(err, allTags) {
		if (err) {
			res.error(err);
		} else {
			res.json(allTags);
		}
	});
};

module.exports.getTag = function(req, res) {
	Tag.findOne({name: req.query.tagName, circleId: req.query.circleId}, function(err, tag) {
		if (err) {
			res.error(err);
		} else {
			res.json(tag);
		}
	});
};

module.exports.updateImage = function(req, res) {
	var file = req.files && req.files.file,
		userId = req.body.userId,
		circleId = req.body.circleId;
		tagName = req.body.tagName;

	if (req.body.linkedImageURI && !req.files) {
		saveUpdatedImage(req.body.linkedImageURI);
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
				} else {
					saveUpdatedImage(savePath);
				}
			});
		});
	}

	function saveUpdatedImage(thePath) {
		Tag.findOne({name: tagName, circleId: circleId}, function(err, tag) {
			tag.image = thePath;
			tag.save(function(err) {
				if (err) {
					console.log("Save failed :(");
					res.json({status: 500});
				} else {
					console.log("Logo save successful! ^_^");
					console.log(tag);
					res.json(tag);
				}
			})
		});
	}
};