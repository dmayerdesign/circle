var Users = require('../datasets/users');
var Circles = require('../datasets/circles');

module.exports.getUsers = function(req, res) {
	if ( req.query.accessCode ) {
		Users.find({accessCodes: req.query.accessCode}, function(err, usersData) {
			if (err) {
				res.error(err);
			} else {
			// My super-jank security measure
				var users = [];
				for (var i = 0; i < usersData.length; i++) {
					var userSans = usersData[i];
					userSans.password = undefined;
					users.push(userSans);
				}

				res.json(users);
			}
		});
	}

	if ( req.query.circleId ) {
		Circles.findById(req.query.circleId, function(err, circle) {
			if (err) {
				res.error(err);
			} else {
				Users.find({accessCodes: circle.accessCode}, function(err, usersData) {
					if (err) {
						res.error(err);
					} else {
					// My super-jank security measure
						var users = [];
						for (var i = 0; i < usersData.length; i++) {
							var userSans = usersData[i];
							userSans.password = undefined;
							users.push(userSans);
						}

						res.json(users);
					}
				});
			}
		});
	}
};

module.exports.getUser = function(req, res) {
	if ( req.query.userId ) {
		Users.findById(req.query.userId, function(err, user) {
			if ( err ) {
				console.log("couldn't find user");
				return;
			}
			if ( user ) { user.password = undefined; }
			res.json(user);
		});
	}

	if ( req.query.username ) {
		Users.findOne({username: req.query.username}, function(err, user) {
			if ( err ) {
				console.log("couldn't find user");
				res.json({status: 500});
				return;
			}
			if ( user ) { 
				user.password = undefined;
				res.json(user);
			} else {
				res.json({status: 500});
			}
		});
	}
};

module.exports.followUser = function(req, res) {
	var userId = req.body.userId,
		otherId = req.body.otherId;

	Users.findById(otherId, function(err, other) {
		other.followers.push({userId: userId});
		other.save();
	});

	Users.findById(userId, function(err, follower) {
		follower.following.push({userId: otherId});
		follower.save(function(err) {
			if (err) {
				console.error(err);
				res.json({status: 500});
			} else {
				res.json({status: 200});
			}
		});
	});
};

module.exports.getUserAvatar = function(req, res) {
	Users.findById(req.query.userId, function(err, user) {
		if (err) {
			res.error(err);
		} else {
			var avatar = user.avatar;
			res.json(user);
		}
	})
};