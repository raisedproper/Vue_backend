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
var schedule = require('node-schedule');

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

router.post("/login", async function(req, res) {
  try {
    var { emailAddress, password } = req.body;
    console.log(password)
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    console.log("hashed", hash);
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
    
    if(user){
    let token =
      Math.random()
        .toString(36)
        .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15);

    const url = "http://krescentglobal.in:3000/resetpassword?token=" + token;

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
      subject: "Welcome to Vue! Reset your password.",
      html: sendHtml
    };
    var mailer = nodemailer.createTransport(sgTransport(options));

    mailer.sendMail(mailOptions, async function(err, info) {
      if (err) {
        console.log(err);
        res.json({
          status: 400,
          message: "error while sending email ",err
        });
      } else {
        console.log('token',token)

        let saveToken = await AdminModel.findOneAndUpdate(
          { emailAddress: emailAddress },
          {
            $set: { resetToken: token, resetTime: new Date().addHours(12) }
          },
          {new: true}
        );
        if (saveToken) {
          console.log("reset token saved",saveToken);
        }
        console.log("Message sent: " + info.message);
        // expire token
       
        var job = new schedule.Job(async function() {
          
           var expireToken = await AdminModel.findOneAndUpdate(
            { resetToken: saveToken.resetToken },
            {
              $set: {
                resetToken: ""
              }
            }
          );
          if (expireToken) {
            console.log("token invalidated");
          } 
        });

        job.schedule(new Date(saveToken.resetTime));
        res.json({
          status: 200,
          message: "email sent sucessfully"
        });
      }
    });
  } else {
    res.json({ status: 403, message: "user not found" });
  }
  } catch (err) {
    console.log(err)
    res.json({ status: 404, message: "error while sending email" });
  }
});

router.put("/resetPassword", async function(req, res) {
  try {
    var { token, password } = req.body;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);

    let updatedUser = await AdminModel.findOneAndUpdate(
      { resetToken: token },
      {
        $set: {
          password: hash,
          resetToken: ""
        }
      }
    );

    if (updatedUser) {
      console.log("token invalidated");
      res.json({
        status: 200,
        message: "password is successfully updated"
      });
    } else {
      res.json({
        status: 400,
        message: "token is invalid"
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
