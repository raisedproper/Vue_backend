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

  UserModel.find({ emailAddress: emailAddress }, function(err, user) {
    if (user[0].isVerified == 1) {
      if (user.length == 1 && user[0].emailAddress == emailAddress) {
        console.log("user found", user);

        let checkpassword = user[0].password;

        let result = bcrypt.compareSync(password, checkpassword);
        if (result == true) {
          const secret = config.loginSecret;
          var token = jwt.sign({ result: emailAddress }, secret);
          const response = {
            authorization: "loggedIn",
            token: token,
            user: user
          };
          res.status(200).json(response);
        } else {
          res.json("password is invalid");
        }
      } else if (user.length == 0) {
        console.log("user doesnot exist");
        res.json("user doesnot exist");
      } else {
        console.log("error while finding user", err);
        res.status(400).json(err);
      }
    } else if (user[0].isVerified == 0) {
      res.json("email address is not verified");
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
      res.json("user already exists");
    } else if (result.length == 0) {
      const secret = config.registerSecret;
      var token = jwt.sign({ result: emailAddress }, secret);
      var User = new UserModel({
        firstName: firstName,
        lastName: lastName,
        emailAddress: emailAddress,
        password: hash,
        isVerified: 0,
        token: token,
        createdAt: date,
        updatedAt: date
      });

      User.save(function(err, resp) {
        if (err) {
          console.log("error while saving User", err);
          res.status(400).json(err);
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
          res.status(200).json(resp);
        }
      });
    } else {
      console.log("error while finding users", err);
      res.status(400).json(err);
    }
  });
});

router.post("/verifyEmail/token?", function(req, res) {
  console.log(req.body)
  var filter = { emailAddress: req.body.emailAddress };
  var update = { isVerified: 1, token: null, updatedAt: date };

  UserModel.findOneAndUpdate(filter, update, { new: true }, function(
    err,
    resp
  ) {
    if (resp) {
      console.log("user updated", resp);
      res.status(200).json(resp);
    } else if (err) {
      res.status(400).json(err);
      throw err;
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
  var { age, location, profession, phoneNumber, emailAddress,gender } = req.body;
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

  jwt.verify(token, config.loginSecret, function(err, decoded) {
    if (err) {
      return res.status(500).send({
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else {
      UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
        if (resp) {
          if (typeof resp.profile.emailAddress == "undefined") {
            console.log("user found", resp);
            let update = { user: resp, profile };
            console.log("update", update);

            UserModel.update(resp, update, function(err, resp) {
              if (resp) {
                console.log("user updated", resp);
                res.status(200).json(resp);
              } else {
                console.log("user not updated", err);
                res.json("user not updated");
              }
            });
          } else if (resp.profile.emailAddress == emailAddress) {
            res.json("profile with this user already exists");
          }
        } else if (err) {
          console.log("error while finding user", err);
          res.status(400).json(err);
        } else if (!resp) {
          console.log("no such user exists");
          res.json("no such user exists");
        }
      });
    }
  });
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
  jwt.verify(token, config.loginSecret, function(err, decoded) {
    if (err) {
      return res.status(500).send({
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else {
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
                res.send({ ...profileDetails, ...socialMediaAccount });
              } else {
                console.log("error while updating user", err);
                res.status(400).json(err);
              }
            }
          );
        } else {
          res.json("error while getting profile", err);
          res.status(400).json(err);
        }
      });
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
  jwt.verify(token, config.loginSecret, function(err, decoded) {
    if (err) {
      return res.status(500).send({
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else {
      UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
        if (resp) {
          console.log("user found", resp);
          res.status(200).json(resp);
        } else {
          console.log("error while finding user", err);
          res.status(400).json(err);
        }
      });
    }
  });
});

module.exports = router;
