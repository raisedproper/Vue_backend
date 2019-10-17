var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var FollowModel = require("../models/FollowAccount");
var multer = require("multer");
var path = require("path");
var routeAuthentication = require("../middleware/authentication");
var moment = require("moment");
var notification = require("../middleware/notification");
var socialMediaAccount = [];
var ids = [];

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});
var date = new Date();

var upload = multer({ storage: storage });

router.use(routeAuthentication);

var socialMediaAccount = {
  facebook: {
    username: "",
    link: "",
    linked: false,
    linkedTofacebook: false
  },
  gmail: {
    username: "",
    link: "",
    linked: false
  },
  instagram: {
    username: "",
    link: "",
    linked: false,
    linkedToinstagram: false
  },
  youtube: {
    username: "",
    link: "",
    linked: false,
    linkedToyoutube: false
  },
  snapchat: {
    username: "",
    link: "",
    linked: false,
    linkedTosnapchat: false
  },
  website: {
    username: "",
    link: "",
    linked: false
  },
  linkedIn: {
    username: "",
    link: "",
    linked: false,
    LinkedTolnkedIn: false
  },
  twitter: {
    username: "",
    link: "",
    linked: false,
    linkedTotwitter: false
  }
};

module.exports = function(socket, nsp) {
  router.post("/imageUpload", upload.single("profilePicture"), async function(
    req,
    res
  ) {
    var token = req.headers["token"];
    console.log("req.file 6768699", req.file);
    var profilePicture = req.file ? req.file.filename : "";

    if (!profilePicture) {
      console.log("profile picture is not uploaded");
    }

    let resp = await UserModel.findOneAndUpdate(
      { token: token },
      {
        $set: {
          "profile.profilePicturePath": profilePicture,
          "profile.updatedAt": date
        }
      },
      { new: true }
    );
    if (resp) {
      console.log("image uploaded successfully", resp.profile);
      return res.json({
        status: 200,
        message: "image uploaded successfully",
        response: { profilePicturePath: resp.profile.profilePicturePath }
      });
    } else if (err) {
      console.log("error while uploading image");
      return res.json({
        status: 404,
        message: "error while uploading image"
      });
    } else if (!resp) {
      console.log("This email Address doesn't exists");
      return res.json({
        status: 400,
        message: "This email Address doesn't exists"
      });
    }
  });

  router.post("/createprofile", function(req, res) {
    var {
      age,
      profession,
      phoneNumber,
      emailAddress,
      gender,
      address
    } = req.body;

    socialMediaAccount["gmail"].link = emailAddress;
    socialMediaAccount["gmail"].linked = true;

    UserModel.findOne({ emailAddress: emailAddress }, function(err, resp) {
      if (resp) {
        if (typeof resp.profile.emailAddress == "undefined") {
          let profile = {
            id: resp.id,
            emailAddress: emailAddress,
            phoneNumber: phoneNumber,
            address: address,
            age: age,
            gender: gender,
            profession: profession,
            socialMediaAccount: socialMediaAccount,
            profilePicturePath: resp.profile.profilePicturePath
              ? resp.profile.profilePicturePath
              : "",
            publicAccount: true,
            createdAt: date,
            updatedAt: date
          };
          let update = { user: resp, profile };

          UserModel.update({ emailAddress: emailAddress }, update, function(
            err,
            response
          ) {
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

  router.post("/addProfileLink", async function(req, res) {
    let emailAddress = req.body.emailAddress;
    var profileLink = req.body.profileLink;
    console.log("profile", profileLink);
    let user = await UserModel.findOne({ emailAddress: emailAddress });
    try {
      if (user.profile.emailAddress) {
        console.log(user.profile.socialMediaAccount);
        console.log(profileLink.link);
        user.profile.socialMediaAccount[profileLink.id].username =
          profileLink.username;
        user.profile.socialMediaAccount[profileLink.id].link = profileLink.link;
        user.profile.socialMediaAccount[profileLink.id].linked =
          profileLink.linked;

        user.profile.updatedAt = date;

        let newProfile = {
          ...user.profile,
          socialMediaAccount: { ...user.profile.socialMediaAccount }
        };
        console.log("newproile", newProfile);

        let updatedUser = await UserModel.findOneAndUpdate(
          { emailAddress: emailAddress },
          { $set: { updatedAt: date, profile: newProfile } },
          { new: true }
        );

        if (updatedUser) {
          console.log("user updated", updatedUser);
          return res.json({
            status: 200,
            message: "Profile link added successfully",
            response: {
              ...newProfile,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName
            }
          });
        } else if (!updatedUser) {
          console.log("Profile link not added ");
          return res.json({
            status: 400,
            message: "Profile link not added "
          });
        }
      } else if (!resp.profile.emailAddress) {
        console.log("This profile doesnot exists");
        return res.json({
          status: 400,
          authorization: false,
          message: "This profile doesnot exists"
        });
      }
    } catch (err) {
      console.log("error while finding user", err);
      return res.json({
        status: 404,
        message: "error while finding user"
      });
    }
  });

  router.get("/viewSelfProfile", async function(req, res) {
    var token = req.headers["token"];
    let user = await UserModel.findOne({ token: token });
    console.log("user found", user);
    if (user) {
      if (user.profile.emailAddress) {
        let profileDetails = {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          ...user.profile
        };
        return res.json({
          status: 200,
          message: "profile fetched successfully",
          response: {
            profileDetails: profileDetails
          }
        });
      } else if (!user.profile.emailAddress) {
        console.log("This profile doesnot exists");
        return res.json({
          status: 400,
          authorization: false,
          message: "This profile doesnot exists"
        });
      }
    }
  });

  router.post("/viewProfile", async function(req, res) {
    let emailAddress = req.body.emailAddress;
    var viewer = req.headers["token"];

    let resp = await UserModel.findOne({ emailAddress: emailAddress });
    console.log("resp", resp);
    if (resp) {
      if (resp.profile.emailAddress) {
        console.log("user found", resp);
        let viewerDetails = await UserModel.findOne({ token: viewer });

        let followedAccounts = await FollowModel.find({
          followerId: viewerDetails.id,
          followId: resp.id
        });

        console.log("followedAccounts", followedAccounts);
        var newSocialMedia = [];
        if (followedAccounts.length >= 1) {
          newSocialMedia = resp.profile.socialMediaAccount;
          followedAccounts.map(accnt => {
            newSocialMedia[accnt.accountType].username = accnt.username;
            newSocialMedia[accnt.accountType].link =
              resp.profile.socialMediaAccount[accnt.accountType].link;

            newSocialMedia[accnt.accountType][
              `linkedTo${accnt.accountType}`
            ] = true;
          });
          console.log("final array", newSocialMedia);
        } else {
          newSocialMedia = resp.profile.socialMediaAccount;
        }

        let profileDetails = {
          id: resp._id,
          firstName: resp.firstName,
          lastName: resp.lastName,
          age: resp.profile.age,
          phoneNumber: resp.profile.phoneNumber,
          emailAddress: resp.profile.emailAddress,
          address: resp.profile.address,
          profession: resp.profile.profession,
          profilePicturePath: resp.profile.profilePicturePath,
          gender: resp.profile.gender,
          socialMediaAccount: newSocialMedia,
          publicAccount: resp.profile.publicAccount,
          createdAt: resp.profile.createdAt,
          updatedAt: resp.profile.updatedAt
        };

        var activityObj = {
          type: "view",
          firstName: viewerDetails.firstName,
          profilePicturePath: viewerDetails.profile.profilePicturePath,
          emailAddress: viewerDetails.profile.emailAddress,
          address: viewerDetails.profile.address,
          time: moment(date).format("LT"),
          text: `${viewerDetails.firstName} viewed your profile`,
          status: false
        };
        notification(resp.id,activityObj)
        return res.json({
          status: 200,
          message: "profile fetched successfully",
          response: {
            profileDetails: profileDetails
          }
        });
      } else if (!resp.profile.emailAddress) {
        console.log("This profile doesnot exists");
        return res.json({
          status: 400,
          authorization: false,
          message: "This profile doesnot exists"
        });
      }
    }
  });

  router.put("/deleteProfileLink", async function(req, res) {
    var socialmediaaccountId = req.body.socialmediaaccountId;

    var emailAddress = req.body.emailAddress;

    var user = await UserModel.findOne({ emailAddress: emailAddress });
    console.log("user", user);

    if (user.profile.emailAddress) {
      user.profile.socialMediaAccount[socialmediaaccountId].username = "";
      user.profile.socialMediaAccount[socialmediaaccountId].link = "";
      user.profile.socialMediaAccount[socialmediaaccountId].linked = false;
      let updatedProfile = {
        ...user.profile,
        socialMediaAccount: { ...user.profile.socialMediaAccount }
      };

      var update = await UserModel.findOneAndUpdate(
        { emailAddress: emailAddress },
        { $set: { updatedAt: date, profile: updatedProfile } }
      );

      if (update) {
        console.log("update", update);
        console.log(`socialMediaAccount ${socialmediaaccountId} deleted`);
        return res.json({
          status: 200,
          message: `socialMediaAccount ${socialmediaaccountId} deleted`,
          response: {
            ...updatedProfile,
            firstName: update.firstName,
            lastName: update.lastName
          }
        });
      } else if (err) {
        console.log(
          `error in deleting socialMediaAccount ${socialmediaaccountId}`
        );
        return res.json({
          status: 400,
          message: `error in deleting socialMediaAccount ${socialmediaaccountId}`
        });
      }
    } else if (!user.profile.emailAddress) {
      console.log("This profile doesnot exists");
      return res.json({
        status: 400,
        authorization: false,
        message: "This profile doesnot exists"
      });
    } else if (err) {
      console.log("error in finding user", err);
    }
  });

  router.put("/accountPrivacy", async function(req, res) {
    let update = await UserModel.findOneAndUpdate(
      { emailAddress: req.body.emailAddress },
      {
        $set: {
          "profile.updatedAt": date,
          "profile.publicAccount": req.body.publicAccount
        }
      },
      { new: true }
    );
    try {
      console.log("public", update.profile);
      if (update.profile.emailAddress) {
        console.log("account privacy changed");
        res.json({
          status: 200,
          message: "account privacy changed",
          response: { publicAccount: update.profile.publicAccount }
        });
      } else if (!update.profile.emailAddress) {
        res.json({
          status: 400,
          message: "Profile doesnot exists"
        });
      }
    } catch (err) {
      console.log(err);
      res.json({
        status: 400,
        message: "account privacy not changed"
      });
    }
  });
  return router;
};
