var express = require("express");
var router = express.Router();
var ConversationModel = require("../models/Conversation");
var routeAuthentication = require("../middleware/authentication");

router.use(routeAuthentication)

router.get('/getConversation', function(req,res){
    var {senderId,recieverId} = req.body
    ConversationModel.find({senderId: senderId,recieverId: recieverId}, function(err,response){
        if(response){
            console.log('conversation fetched successfully',response)
            res.json({
                status: 200,
                message: 'conversation fetched successfully',
                response: response
            })
        } else if(!response){
            console.log('no conversation')
            res.json({
                status: 202,
                message: 'no conversation exists',
            })
        }
        
        else if(err){
            console.log('error fetching conversation',err)
            res.json({
                status: 404,
                message: 'error fetching conversation',
            })
        }
    })
})

module.exports = router