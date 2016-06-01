function resizeAvatar(avatar, _) {
	_(avatar).parents(".avatar-container").imagefill();
	var _avatar = _(avatar);
	_avatar.css({
		height: "auto",
		width: "auto"
	});
	var avatarWidth = _avatar.width();
	var avatarHeight = _avatar.height();
	var _container = _avatar.parents(".avatar-container");
	var containerDimensions = {
		width: _container.width(),
		height: _container.height()
	};

	if ( avatarWidth > avatarHeight ) {
		var stretchDir = "height";
		var otherDir = "width";
		var marginDir = "top";
		var OGaspectRatio = avatarWidth/avatarHeight;
		var diff = containerDimensions.height - avatarHeight;
	} else {
		var stretchDir = "width";
		var otherDir = "height";
		var marginDir = "left";
		var OGaspectRatio = avatarHeight/avatarWidth;
		var diff = containerDimensions.width - avatarWidth;
	}

	var cssObj = {};
	cssObj[stretchDir] = containerDimensions[stretchDir];
	cssObj[otherDir] = containerDimensions[stretchDir] * OGaspectRatio;
	cssObj["margin-" + marginDir] = -(diff/2);
	
	_avatar.css(cssObj);
}

/**/
/** SOCK JS MESSAGING
/**/

// index.html
/**
<script src="http://cdn.sockjs.org/sockjs-0.3.min.js"></script>

<div class="message-box">
    <ul>
        <li ng-repeat="message in messages">{{message}}</li>
    </ul>

    <form ng-submit="sendMessage()">
        <input type="text" ng-model="messageText" placeholder="Type your message here" />
        <input type="submit" value="Send" />
    </form
</div>
**/

// main-controller.js
var sock = new SockJS('http://192.168.0.74:9999/chat');
$scope.messages = [];
$scope.sendMessage = function() {
    sock.send($scope.messageText);
    $scope.messageText = "";
};

sock.onmessage = function(e) {
    $scope.messages.push(e.data);
    $scope.$apply();
};


// server.js
var http = require('http');
var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer();
chat.on('connection', function(conn) {
    connections.push(conn);
    var number = connections.length;
    conn.write("Welcome, User " + number);
    conn.on('data', function(message) {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write("User " + number + " says: " + message);
        }
    });
    conn.on('close', function() {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write("User " + number + " has disconnected");
        }
    });
});

var server = http.createServer();
chat.installHandlers(server, {prefix:'/chat'});
server.listen(9999, '0.0.0.0');




		// $scope.infiniteScroll = function () {
		// 	var that = this;

		// 	setInterval(function() {
		// 		_(".posts-archive-container").scroll(function() {
		// 			var scrollTop = _(this).scrollTop();
		// 			var archiveHeight = _(this).height();

		// 			if ( scrollTop > archiveHeight + _(window).height() - 200 ) {
		// 				console.log( "scroll top: " + scrollTop );
		// 				that.postsAllowed.allow += 4;
		// 				console.log("allowed: " + that.postsAllowed.allow);
		// 			}
		// 		});
		// 	}, 1000);
		// };
		//$scope.infiniteScroll();



			// var verticallyCenter = setInterval(function() {
			// 	if ( _(".setup-form-container").length ) {
			// 		_(".setup-form-container").css({
			// 			top: (window.innerHeight / 3) + "px",
			// 			opacity: 1
			// 		});
			// 		clearInterval(verticallyCenter);
			// 	}
			// }, 500);



			

			// Post.find({circleId: req.query.circleId, type: "quest"})
			// .$where('this.quest.due < Date.now()')
			// .exec(function(err, questsPastDue) {
			// 	if (err) {
			// 		console.error(err);
			// 	} else {
			// 		for (var i = 0; i < questsPastDue.length; i++) {
			// 			Post.findOne({_id: questsPastDue[i]._id}, function(err, quest) {
			// 				if (err) {
			// 					console.error(err);
			// 				} else {
			// 					quest.status = "failed";
			// 					quest.save();
			// 				}
			// 			});
			// 		}
			// 	}
			// });