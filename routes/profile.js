var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var multer = require("multer");
var path = require('path')
var routeAuthentication = require('../middleware/authentication');

var socialMediaAccount = [];
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

  router.use(routeAuthentication)

router.post("/createprofile", upload.single("profilePicture"), function(
    req,
    res
  ) {
    var profilePicture = req.file;
  
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
    } 
  
    let profile = {
      emailAddress: emailAddress,
      phoneNumber: phoneNumber,
      age: age,
      gender: gender,
      location: location,
      profession: profession,
      profilePicturePath: req.file.path,
      createdAt: date,
      updatedAt: date
    };
  
    UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
      console.log('here',resp)
      if (resp) {
        if (typeof resp.profile.emailAddress == "undefined") {
          console.log("user found", resp);
          let update = { user: resp, profile };
          console.log("update", update);
  
          UserModel.update(resp, update, function(err, response) {
            if (response) {
              console.log("profile created successfully", response);
             return res.json({
                status: 200,
                message: "Profile created successfully",
                response: profile
              });
            } else {
              console.log("user not updated", err);
             return res.json({
                status: 400,
                message: "Profile not created",
                emailAddress: resp.emailAddress
              });
            }
          });
        } else if (resp.profile.emailAddress == emailAddress) {
         return res.json({
            status: 202,
            message: "Profile with this user already exists",
            emailAddress: resp.emailAddress
          });
        }
      } else if (err) {
        console.log("error while finding user", err);
       return res.json({
          status: 400,
          message: "User couldn't be found",
          emailAddress: resp.emailAddress
        });
      } else if (!resp) {
        console.log("This email Address doesn't exists");
       return res.json({
          status: 400,
          authorization: false,
          message: "This email Address doesn't exists"
        });
      }
    });
  });
  
  router.post("/addProfileLink", function(req, res) {
    let emailAddress = req.body.emailAddress;
  
    UserModel.findOne({emailAddress: emailAddress }, function(err, resp) {
      if (resp) {
        socialMediaAccount = resp.profile.socialMediaAccount;
        console.log(req.body.id);
        resp.profile.socialMediaAccount.map(obj => {
          if(obj.id != undefined && !ids.includes(obj.id)){
          ids.push(obj.id);
          }
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
  
          let newProfile = {
            ...resp.profile,
            socialMediaAccount: [...socialMediaAccount]
          };
          console.log("newproile", newProfile);
          UserModel.updateOne(
            { emailAddress: emailAddress },
            { $set: { updatedAt: date, profile: newProfile } },
            function(err, response) {
              if (response) {
                console.log("user updated", response);
                ids.push(req.body.id);
               return res.json({
                  status: 200,
                  message: "Profile link added successfully",
                  socialMediaAccount: [ ...socialMediaAccount ]
                });
              } else {
                console.log("error while updating user", err);
               return res.json({
                  status: 400,
                  message: "Profile link not added ",
                  socialMediaAccount: [ ...socialMediaAccount ]
                });
              }
            }
          );
        } else {
        return res.json({
            status: 202,
            message: "This profile link already exists ",
            socialMediaAccount: [ ...socialMediaAccount ]
          });
        }
      } else if (!resp) {
        console.log("This email Address doesn't exists");
        return res.json({
           status: 400,
           authorization: false,
           message: "This email Address doesn't exists"
         });
      } else {
        console.log("error while getting profile", err);
       return res.json({
          status: 400,
          message: "Profile link not added ",
          socialMediaAccount: [ ...socialMediaAccount ]
        });
      }
    });
  });
  
  router.post("/viewProfile", function(req, res) {
      let emailAddress = req.body.emailAddress
    UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
      if (resp) {
        console.log("user found", resp);
  /*       const host = req.hostname; */
  
        let profileDetails = {
          firstName: resp.firstName,
          lastName: resp.lastName,
         /*  profileImage: req.protocol+ "://" + host  + '/' + resp.profile.profilePicturePath, */
          ...resp.profile,
        }
       return res.json({
          status: 200,
          message: "profile fetched successfully",
          response: {
            profileDetails: profileDetails,
          }
        });
      } else if (!resp) {
        console.log("This email Address doesn't exists");
        return res.json({
           status: 400,
           authorization: false,
           message: "This email Address doesn't exists"
         });
      } else {
        console.log("error while finding user", err);
       return res.json({
          status: 400,
          message: "profile couldn't be fetched"
        });
      }
    });
  });

router.put("/deleteProfileLink", function(req, res) {
  var socialmediaaccount = req.body.socialmediaaccount;
  var emailAddress = req.body.emailAddress;

  UserModel.findOneAndUpdate(
    { emailAddress: emailAddress },
    { $pull: { "profile.socialMediaAccount": { id: socialmediaaccount.id }} },
    {new: true},
    function(err, resp) {
      if (resp) {
        console.log(resp.profile);
        var index;
        resp.profile.socialMediaAccount.map(obj => {
          if (socialmediaaccount.id == obj.id) {
            index = true;
          } else {
            index = false;
          }
        });
        console.log("index", index);
        if (index == true) {
          console.log(`socialMediaAccount ${socialmediaaccount.id} deleted`);
          return res.json({
            status: 200,
            message: `socialMediaAccount ${socialmediaaccount.id} deleted`,
            response: resp.profile
          });
        } else {
          console.log(
            `socialMediaAccount ${socialmediaaccount.id} doesnot exist`
          );
          return res.json({
            status: 202,
            message: `socialMediaAccount ${socialmediaaccount.id}  doesnot exist`,
            response: resp.profile
          });
        }
      } else if (!resp) {
        console.log("err", err);
        return res.json({
          status: 400,
          message: `This emailAddress doesnot exist`,
          emailAddress: emailAddress
        });
      } else if (err) {
        console.log("err", err);
        return res.json({
          status: 400,
          message: `error in deleting socialMediaAccount ${linkId}`,
          response: resp.profile
        });
      }
    }
  );
});

module.exports = router;
