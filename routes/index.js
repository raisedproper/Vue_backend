var express = require("express");
var router = express.Router();
var FCM = require('fcm-node');
var serverKey="AIzaSyDhQ1BgOeiRkmEJeZuV3eLGa5lEiwdce1A";
var fcm = new FCM(serverKey);
router.get('/', function(req,res){
    res.render('index')
})

router.post('/sendPushNotifications', function(req,res){
    var data=req.body;
    var token=req.token;

    var message= {
        to: token,
        notification: {
            title: data.firstName,
            icon: data.profilePicture,
            body: data.message,
            time: date
        },
        data: data
    };
    fcm.send(message, function(err,response){
        if(err){
            res.json({
                status: 400,
                message: 'error while sending push notification'
            })
        } else {
            res.json({
                status: 200,
                message: 'push notification send successfully'
            })
        }
    })
})

router.get('getPushNotifications', function(req,res){
    
})

module.exports = router;