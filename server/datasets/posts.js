var mongoose = require('mongoose');

module.exports = mongoose.model('Post', {
	authorName: String,
	user: String,
	userId: String,
	circleId: String,
	avatar: String,
	type: {type: String, default: 'normal'},
	content: String,
	date: {type: Date, default: Date.now},
	eventDate: Date,
	eventLocation: String,
	tags: [String],
	usersMentioned: [String],
	images: [String],
	quest: {
		status: {type: String, default: 'in_progress'},
		completers: [String],
		due: Date,
		worth: {
			currency: Number,
			achievement: {
				title: String
			}
		}
	},
	poll: [{
		choice: String,
		votes: {type: Number, default: 0},
		voters: [String]
	}],
	linkEmbed: {
		url: String,
		type: String,
		thumbnail_url: String,
		title: String,
		description: String,
		provider_url: String
	},
	comments: [
		{
			authorName: String,
			user: String,
			userId: String,
			avatar: String,
			content: String,
			date: {type: Date, default: Date.now},
			usersMentioned: [String],
			images: [String],
			linkEmbed: {
				url: String,
				type: String,
				thumbnail_url: String,
				title: String,
				description: String,
				provider_url: String
			},
			reactions: {
				like: {
					amount: {type: Number, default: 0},
					users: [String]
				},
				love: {
					amount: {type: Number, default: 0},
					users: [String]
				}
			}
		}
	],
	reactions: {
		like: {
			amount: {type: Number, default: 0},
			users: [String]
		},
		love: {
			amount: {type: Number, default: 0},
			users: [String]
		}
	}
})