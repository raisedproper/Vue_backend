var express = require("express");
var router = express.Router();

var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");

router.post("/createMessage", function(req, res) {
   var {recieverId} = req.body;

      
  });

module.exports = router