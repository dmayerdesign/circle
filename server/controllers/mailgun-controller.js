var Mailgun = require('mailgun-js');
var mg_api_key = 'key-f2e3b26ac7c3b097be161dba9d863929';
var mg_domain = 'sandboxc6b9c4af7d3c440c872983b5608d25d5.mailgun.org';
var mg_from = 'd.a.mayer92@gmail.com';

module.exports.verifyEmail = function(req,res) {
  //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
  var mailgun = new Mailgun({apiKey: mg_api_key, domain: mg_domain});

  var data = {
  //Specify email data
    from: mg_from,
  //The email to contact
    to: req.params.email,
  //Subject and text data  
    subject: "Verify your Circle account",
    html: "Hey! Thanks for joining this thing. All you need to do now is click on the link below, and you can start circle-in' it up big time.<br><br><a href='http://localhost:3000/#/verify-email?email=" + req.params.email + "&verifyEmail=" + req.params.vcode + "' target='_blank' style='display:block; width:200px; text-align:center; padding:20px 0; font-family:Helvetica, Arial, sans-serif; font-size:10px; color:white; text-transform:uppercase; text-decoration:none; letter-spacing:0.5px; background-color:#90def0; background-color:linear-gradient(45deg, #44ddf0, #44f0dd); border-radius:10px;'>Verify my account</a>"
  };

  //Invokes the method to send emails given the above data with the helper library
  mailgun.messages().send(data, function (err, body) {
      if (err) {
          res.json({status:500});
          console.error(err);
      }
      else {
      	console.log("data: ");
        console.log(data);
        console.log("body: ");
        console.log(body);
        res.json(body);
      }
  });
};

module.exports.newCircle = function(req,res) {
  var mailgun = new Mailgun({apiKey: mg_api_key, domain: mg_domain});

  console.log( req.body );
  if ( !req.body.circleData ) { 
  	console.error("couldn't send the 'new circle' email because circle data wasn't present.");
  	return;
  }

  console.log( req.body );

  var circle = req.body.circleData;

  var data = {
    from: mg_from,
    to: req.body.email,
    subject: "You made a new circle named " + circle.name + ". Good job!",
    html: "Hey! Thanks for creating a new circle.<br><br><h4>This is important:</h4>For anyone to join your circle, they need 2 things: (1) the <strong>access code</strong> (which our system generates automatically) and the <strong>access answer</strong> (which you came up with when you created the circle).<br><br>The <strong>access code</strong> for <strong>" + circle.name + "</strong>: " + circle.accessCode + "<br>The <strong>access riddle</strong>: " + circle.accessRiddle + "<br>And the <strong>access answer</strong>: " + circle.accessAnswer + "<br><br>Have fun!"
  };

  mailgun.messages().send(data, function (err, body) {
      if (err) {
          res.json({status:500});
          console.error(err);
      }
      else {
      	console.log("data: " + data);
          console.log("body: " + body);
         	res.json(body);
      }
  });
};