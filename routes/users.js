var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const bcrypt = require("bcrypt");
var multer = require("multer");
var path = require('path')
var redis = require("redis");
var JWTR = require("jwt-redis").default;

//ES6 import JWTR from 'jwt-redis';
var redisClient = redis.createClient();
var jwtr = new JWTR(redisClient);
var config = require("../config");

const saltRounds = 10;
var socialMediaAccount = [];
var payload = {};
var ids = [];

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
});
var date = new Date();

var upload = multer({ storage: storage });

/* GET users listing. */
router.post("/login", function(req, res, next) {
  let { emailAddress, password } = req.body;
  UserModel.find({ emailAddress: emailAddress }, async function(err, user) {
    if (user.length == 1 && user[0].emailAddress == emailAddress) {
      let checkpassword = user[0].password;
      let profileImage = {profilePicture: user[0].profile.profilePicture,profilePicturePath: user[0].profile.profilePicturePath}
      let result = bcrypt.compareSync(password, checkpassword);
      if (result == true) {
        console.log(user[0].token);

        var token = await jwtr.sign(payload, config.Secret).then(resp => {
          return resp;
        });
        console.log("new token", token);
        UserModel.updateOne(
          { emailAddress: emailAddress },
          { $set: { token: token } },
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

  UserModel.find({ emailAddress: emailAddress }, async function(err, result) {
    if (result.length >= 1) {
      console.log("users already exists", result[0].emailAddress);
      res.json({
        status: 200,
        message: "users already exists"
      });
    } else if (result.length == 0) {
      var token = await jwtr.sign(payload, config.Secret).then(resp => {
        return resp;
      });

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

router.post("/createprofile", upload.single("profilePicture"), function(
  req,
  res
) {
  var profilePicture = req.file;
  var token = req.headers["token"];
  console.log("token", token);

  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }
  var {
    age,
    location,
    profession,
    phoneNumber,
    emailAddress,
    gender
  } = req.body;
  if (!profilePicture) {
    console.log("profile picture is not uploaded");
  } else {
    let img = fs.readFileSync(profilePicture.path);
    
    let encode_img = img.toString("base64");
    var final_img = {
      data: new Buffer(encode_img, "base64"),
      contentType: profilePicture.mimetype
    };
  }

  let profile = {
    emailAddress: emailAddress,
    phoneNumber: phoneNumber,
    age: age,
    gender: gender,
    location: location,
    profession: profession,
    profilePicture: req.file.filename,
    profilePicturePath: req.file.path,
    createdAt: date,
    updatedAt: date
  };

  UserModel.findOne({ token: token }, function(err, resp) {
    if (resp) {
      if (typeof resp.profile.emailAddress == "undefined") {
        console.log("user found", resp);
        let update = { user: resp, profile };
        console.log("update", update);

        UserModel.update(resp, update, function(err, resp) {
          if (resp) {
            console.log("profile created successfully", resp);
            res.json({
              status: 200,
              message: "profile created successfully"
            });
          } else {
            console.log("user not updated", err);
            res.json({
              status: 400,
              message: "profile not created",
              emailAddress: resp.emailAddress
            });
          }
        });
      } else if (resp.profile.emailAddress == emailAddress) {
        res.json({
          status: 200,
          message: "profile with this user already exists",
          emailAddress: resp.emailAddress
        });
      }
    } else if (err) {
      console.log("error while finding user", err);
      res.json({
        status: 400,
        message: "user couldn't be found",
        emailAddress: resp.emailAddress
      });
    } else if (!resp) {
      console.log("Failed to authenticate token.");
      res.json({
        status: 400,
        authorization: false,
        message: "Failed to authenticate token."
      });
    }
  });
});

router.post("/addProfileLink", function(req, res) {
  let emailAddress = req.body.emailAddress;
  var token = req.headers["token"];

  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }

  UserModel.findOne({ token: token }, function(err, resp) {
    console.log(resp);
    if (resp) {
      socialMediaAccount = resp.profile.socialMediaAccount;
      console.log(req.body.id);
      resp.profile.socialMediaAccount.map(obj => {
        ids.push(obj.id);
      });
      console.log("ids", ids);
      if (!ids.includes(req.body.id) && req.body.id != null) {
        let socialAccountObj = {
          id: req.body.id,
          link: req.body.link,
          linked: true
        };
        socialMediaAccount.push(socialAccountObj);

        resp.profile.updatedAt = date;

        resp.profile.publicAccount = req.body.publicAccount;

        var profileDetails = {
          firstName: resp.firstName,
          lastName: resp.lastName,
          emailAddress: resp.emailAddress,
          location: resp.profile.location,
          profession: resp.profile.profession,
          age: resp.profile.age,
          profilePicture: resp.profile.profilePicture.data,
          publicAccount: resp.profile.publicAccount
        };
        console.log("profileDetails", profileDetails);
        let newProfile = {
          ...resp.profile,
          socialMediaAccount: socialMediaAccount
        };
        console.log("newproile", newProfile);
        UserModel.updateOne(
          { emailAddress: emailAddress },
          { $set: { updatedAt: date, profile: newProfile } },
          function(err, resp) {
            if (resp) {
              console.log("user updated", resp);
              ids.push(req.body.id);
              res.json({
                status: 200,
                message: "profile link added successfully",
                socialMediaAccount: { ...socialMediaAccount }
              });
            } else {
              console.log("error while updating user", err);
              res.json({
                status: 400,
                message: "profile link not added ",
                socialMediaAccount: { ...socialMediaAccount }
              });
            }
          }
        );
      } else {
        res.json({
          status: 200,
          message: "This profile link already exists ",
          socialMediaAccount: { ...socialMediaAccount }
        });
      }
    } else if (!resp) {
      console.log("error while authenticating token");
      res.json({
        status: 400,
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else {
      console.log("error while getting profile", err);
      res.json({
        status: 400,
        message: "profile link not added ",
        socialMediaAccount: { ...socialMediaAccount }
      });
    }
  });
});

router.post("/viewProfile", function(req, res) {
  var token = req.headers["token"];
  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }

  UserModel.findOne({ token: token }, function(err, resp) {
    if (resp) {
      console.log("user found", resp);
      const host = req.host;
      let profileDetails = {
        firstName: resp.firstName,
        lastName: resp.lastName,
        profileImage: req.protocol+ "://" + host  + '/' + resp.profile.profilePicturePath,
        ...resp.profile,
      }
      res.json({
        status: 200,
        message: "profile fetched successfully",
        response: {
          profileDetails: profileDetails,
        }
      });
    } else if (!resp) {
      console.log("error while authenticating token");
      res.json({
        status: 400,
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else {
      console.log("error while finding user", err);
      res.json({
        status: 400,
        message: "profile couldn't be fetched"
      });
    }
  });
});

module.exports = router;
