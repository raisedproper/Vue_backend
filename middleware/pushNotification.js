var FCM = require('fcm-node');
var serverKey="AIzaSyDhQ1BgOeiRkmEJeZuV3eLGa5lEiwdce1A";
var fcm = new FCM(serverKey);

module.exports  = function(token,data){
    console.log('token',token);
    console.log(data)
    var message = {
        to: token,
        notification: {
          title: data.firstName,
          icon: data.profilePicturePath,
          body: data.text,
          time: data.time
        },
        data: data
      };
      fcm.send(message, function(err, response) {
        if (err) {
          console.log("error while sending push notification");
        } else {
          console.log("push notification send successfully");
        }
      });
}