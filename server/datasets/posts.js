var mongoose = require('mongoose');

module.exports = mongoose.model('Post', {
	user: String,
	userId: String,
	circleId: String,
	avatar: String,
	type: {type: String, default: 'normal'},
	content: String,
	date: {type: Date, default: Date.now},
	images: [String],
	link: {
		url: String,
		thumbnail_url: String,
		title: String,
		description: String,
		provider_url: String,
		type: String
	},
	eventDate: Date,
	eventLocation: String,
	quest: {
		questers: [String],
		completers: [String],
		due: Date,
		worth: {
			currency: Number,
			achievement: String
		}
	},
	tags: [String]
})