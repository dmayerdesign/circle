var Post = require('../datasets/posts');

module.exports.postPost = function(req, res) {
	console.log("POSTING: ");
	console.log(req.body);
	var post = new Post(req.body);
	post.save(function(error) {
		if (error) {
			console.log("ERROR:");
			console.log(error);
		} else {
			console.log("SAVED POST");
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