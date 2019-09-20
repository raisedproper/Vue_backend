var express = require("express");
var router = express.Router();
var ChatModel = require("../models/Chat");
const jwt = require("jsonwebtoken");
const config = require("../config");

router.post('/sendMessage',function(req,res){
  var {senderId, recieverId,message,isRead} = req.body;

let messageObject = {
    
}

  ChatModel.save()
})