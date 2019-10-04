var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
var config = require("../config");

var saltRounds = 10
var date = new Date()

router.post("/login", function(req, res, next) {
  let { emailAddress, password } = req.body;
  UserModel.find({ emailAddress: emailAddress }, function(err, user) {
    if (user.length == 1 && user[0].emailAddress == emailAddress) {
      let checkpassword = user[0].password;
      let profileImage = {profilePicturePath: user[0].profile.profilePicturePath}
      let result = bcrypt.compareSync(password, checkpassword);
      if (result == true) {
        console.log(user[0].token);

        var token = jwt.sign({emailAddress: emailAddress}, config.Secret)
        console.log("new token", token);
        UserModel.updateOne(
          { emailAddress: emailAddress },
          { $set: { token: token,updatedAt: date } },
          function(err, resp) {
            if (resp) {
              console.log("token updated",);
              var response = {
                status: 200,
                message: "login successfully",
                response: {
                  token: token,
                  emailAddress: emailAddress,
                  profilePicture: profileImage
                }
              };
              res.json(response);
            } else if (err) {
              console.log("error while updating token", err);
              res.json({
                status: 400,
                message: "login unsuccessful"
              });
            }
          }
        );
      } else {
        res.json({
          status: 500,
          message: "password is invalid"
        });
      }
    } else if (user.length == 0) {
      console.log("user doesnot exist");
      res.json({
        status: 400,
        message: "user doesnot exist"
      });
    } else {
      console.log("error while finding user", err);
      res.json({
        status: 400,
        message: "user not saved"
      });
    }
  });
});

router.post("/register", function(req, res) {
  let { firstName, lastName, password, emailAddress } = req.body;
  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(password, salt);

  UserModel.find({ emailAddress: emailAddress }, function(err, result) {
    if (result.length >= 1) {
      console.log("users already exists", result[0].emailAddress);
      res.json({
        status: 200,
        message: "users already exists"
      });
    } else if (result.length == 0) {
      var token = jwt.sign({emailAddress: emailAddress}, config.Secret)

      var User = new UserModel({
        firstName: firstName,
        lastName: lastName,
        emailAddress: emailAddress,
        password: hash,
        token: token,
        createdAt: date,
        updatedAt: date
      });

      User.save(function(err, resp) {
        if (err) {
          console.log("error while saving User", err);
          res.json({
            status: 400,
            message: "user not saved"
          });
        } else {
          console.log("User saved successfully");
          res.json({
            status: 200,
            message: "user registered successfully",
            token: resp.token,
            emailAddress: resp.emailAddress
          });
        }
      });
    } else {
      console.log("error while finding users", err);
      res.json({
        status: 400,
        message: "user not saved"
      });
    }
  });
});

module.exports = router;
