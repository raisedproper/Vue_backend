var express = require("express");
var router = express.Router();
var ConversationModel = require("../models/Conversation");
var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");

router.post("/createMessage", function(req, res) {
   var {recieverId} = req.body;

        io.on("connection", socket => {
          console.log("connection established");
          res.status(200).json("connection established");
          io.emit("message", "hello world");
          socket.on("hello", function(msg) {
            console.log(msg);
          });
        });
      
  });

module.exports = router