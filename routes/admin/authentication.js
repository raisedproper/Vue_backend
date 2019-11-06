var express = require("express");
var router = express.Router();
var toUpper = require("../../middleware/upper");
var config = require("../../config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
var nodemailer = require("nodemailer");
const fs = require("fs");
var path = require("path");
var Handlebars = require("handlebars");
var sgTransport = require("nodemailer-sendgrid-transport");
var AdminModel = require("../../models/Admin");

router.post("/login", async function(req, res) {
    try {
  var { emailAddress, password } = req.body;
 /*  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);
  console.log(hash); */
  emailAddress = toUpper(emailAddress);

    let admin = await AdminModel.findOne({ emailAddress: emailAddress });

    if (admin) {
      let checkpassword = admin.password;
      let result = bcrypt.compareSync(password, checkpassword);

      if (result == true) {
        var token = jwt.sign({ emailAddress: emailAddress }, config.Secret);
        let updateToken = await AdminModel.updateOne(
          { emailAddress: emailAddress },
          {
            $set: { token: token, updatedAt: new Date() }
          }
        );
        if (updateToken) {
          console.log("token updated");
        }
        let resp = {
          emailAddress: admin.emailAddress,
          name: admin.name,
          token: token
        };
        res.json({
          status: 200,
          message: "admin login successfull",
          response: resp
        });
      } else {
        res.json({
          status: 400,
          message: "incorrect password"
        });
      }
    } else {
      res.json({
        status: 401,
        message: "admin doesnot exists"
      });
    }
  } catch (err) {
    res.json({ status: 404, message: "error while logging in" });
  }
});

router.post("/forgetPassword", async function(req, res) {
  try {
    var { emailAddress } = req.body;
    emailAddress = toUpper(emailAddress);
    let user = await AdminModel.findOne({ emailAddress: emailAddress });
  
    const url = "http://localhost:3000/forgetPassword";

    var options = {
      auth: {
        api_key:
          "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"
      }
    };
    let filepath = path.resolve(__dirname, "../../views/forgetPassword.html");

    const html = fs.readFileSync(filepath).toString();
    var template = Handlebars.compile(html);
    var replacements = {
      name: user.name,
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
    
    mailer.sendMail(mailOptions, function(err, info) {
      if (err) {
        console.log(err);
        res.json({
          status: 400,
          message: "error while sending email "
        });
      } else {
        console.log("Message sent: " + info.message);
        res.json({
          status: 200,
          message: "email sent sucessfully"
        });
      }
    });
  } catch (err) {
    res.json({ status: 404, message: "error while sending email" });
  }
});

router.put("/resetPassword", async function(req, res) {
  try {
    var { emailAddress, password } = req.body;
    emailAddress = toUpper(emailAddress);
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
   
    let updatedUser = await AdminModel.findOneAndUpdate(
      { emailAddress: emailAddress },
      {
        $set: {
          password: hash
        }
      }
    );

    if (updatedUser) {
      res.json({
        status: 200,
        message: "password is successfully updated"
      });
    } else {
      res.json({
        status: 400,
        message: "password is not updated"
      });
    }
  } catch (err) {
    res.json({
      status: 404,
      message: "error while updating password"
    });
  }
});

module.exports = router;
