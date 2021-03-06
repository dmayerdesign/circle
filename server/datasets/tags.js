var mongoose = require('mongoose');

module.exports = mongoose.model('Tag', {
	name: String,
	date: {type: Date, default: Date.now},
	circleId: String,
	image: String,
	count: Number
});