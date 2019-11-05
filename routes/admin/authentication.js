var express = require("express");
var router = express.Router();
var toUpper = require("../../middleware/upper");
var config = require("../../config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
var AdminModel = require("../../models/Admin");

router.post("/login", async function(req, res) {
  var { emailAddress, password, name } = req.body;

  emailAddress = toUpper(emailAddress);
  name = toUpper(name);

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
});

router.post("/resetPassword", function(req,res){
    
})

module.exports = router;
