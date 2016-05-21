var Tag = require('../datasets/tags');
var Circle = require('../datasets/circles');

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

			tag.save();

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