var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
const fs = require("fs");
var path = require("path");
var Handlebars = require("handlebars");
var sgTransport = require("nodemailer-sendgrid-transport");
const bcrypt = require("bcrypt");
var multer = require("multer");
const saltRounds = 10;
var socialMediaAccount = [];
var config = require("../config");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  }
});
var date = new Date();

var upload = multer({ storage: storage });

/* GET users listing. */
router.post("/login", function(req, res, next) {
  let { emailAddress, password } = req.body;
  console.log(emailAddress, password);
  UserModel.find({ emailAddress: emailAddress }, function(err, user) {
    if (user.length == 1 && user[0].emailAddress == emailAddress) {

      let checkpassword = user[0].password;

      let result = bcrypt.compareSync(password, checkpassword);
      if (result == true) {
        const secret = config.loginSecret;
        var token = jwt.sign({ result: emailAddress }, secret);
        console.log("user", user);
        user.token = token;

        var response = {
          status: 200,
          message: "login successfully",
          token: user.token,
          emailAddress: user.emailAddress
        };
        res.json(response);
      } else {
        res.json({ 
          status: 200,
          message: "password is invalid"
        });
      }
    } else if (user.length == 0) {
      console.log("user doesnot exist");
      res.json({ 
        status: 200,
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
      const secret = config.registerSecret;
      var token = jwt.sign({ result: emailAddress }, secret, {
        expiresIn: "12h"
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

          let url = "http://localhost:3000/verifyEmail/token?" + token;
          var options = {
            auth: {
              api_key:
                "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"
            }
          };

          let filepath = path.resolve(
            __dirname,
            "../views/emailVerification.html"
          );
          const html = fs.readFileSync(filepath).toString();
          var template = Handlebars.compile(html);
          var replacements = {
            name: firstName + lastName,
            url: url
          };
          var sendHtml = template(replacements);

          var mailOptions = {
            from: "vue@gmail.com",
            to: emailAddress,
            subject: "Welcome to Vue! Confirm your email",
            html: sendHtml
          };

          var mailer = nodemailer.createTransport(sgTransport(options));
          console.log("mailOptions", mailOptions);

          mailer.sendMail(mailOptions, function(err, info) {
            if (err) {
              console.log(err);
            } else {
              console.log("Message sent: " + info.message);
            }
          });
          res.json({
            status: 200,
            message: "user registered successfully",
            token: resp.token,
            emailAddress: resp.emailAddress
          })
        }
      });
    } else {
      console.log("error while finding users", err);
      res.json({
        status: 400,
        message: "user not saved",
      })
    }
  });
});

router.post("/createprofile", upload.single("profilePicture"), function(
  req,
  res
) {
  var profilePicture = req.file;
  console.log("req", req.headers);
  var token = req.headers["token"];
  console.log("token", req.headers["token"]);
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
    profilePicture: final_img,
    createdAt: date,
    updatedAt: date
  };

  /*   jwt.verify(token, config.loginSecret, function(err, decoded) { */
  /*  if (err) {
      return res.status(500).send({
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else { */
  UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
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
              message: "profile created successfully",
            })
          } else {
            console.log("user not updated", err);
            res.json({
              status: 400,
              message: "profile not created",
              emailAddress: resp.emailAddress,
            })
          }
        });
      } else if (resp.profile.emailAddress == emailAddress) {
        res.json({
          status: 200,
          message: "profile with this user already exists",
          emailAddress: resp.emailAddress,
        })
      }
    } else if (err) {
      console.log("error while finding user", err);
      res.json({
        status: 400,
        message: "user couldn't be found",
        emailAddress: resp.emailAddress,
      })
    } else if (!resp) {
      console.log("no such user exists");
      res.json({
        status: 200,
        message: "no such user exists",
        emailAddress: resp.emailAddress,
      })
    }
  });
  /* } */
  /*  }); */
});

let ids = [];

router.post("/addProfileLink", function(req, res) {
  let emailAddress = req.body.emailAddress;
  var token = req.headers["token"];
  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }

  UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
    if (resp) {
      socialMediaAccount = resp.profile.socialMediaAccount;
      if (!ids.includes(req.body.id) && req.body.id != null) {
        let socialAccountObj = {
          id: req.body.id,
          link: req.body.link,
          linked: true
        };
        socialMediaAccount.push(socialAccountObj);
      }
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
              socialMediaAccount: {...socialMediaAccount},
            })
        
          } else {
            console.log("error while updating user", err);
            res.json({
              status: 400,
              message: "profile link not added ",
              socialMediaAccount: {...socialMediaAccount},
            })
          }
        }
      );
    } else {
      console.log("error while getting profile", err);
      res.json({
        status: 400,
        message: "profile link not added ",
        socialMediaAccount: {...socialMediaAccount},
      })
    }
  });
});

router.post("/viewProfile", function(req, res) {
  let emailAddress = req.body.emailAddress;
  var token = req.headers["token"];
  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }

  UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
    if (resp) {
      console.log("user found", resp);
      res.json({
        status: 200,
        message: "profile fetched successfully",
        profileDetails: resp.profile 
      })
    } else {
      console.log("error while finding user", err);
      res.json({
        status: 400,
        message: "profile couldn't be fetched",
      })
    }
  });
});

module.exports = router;
