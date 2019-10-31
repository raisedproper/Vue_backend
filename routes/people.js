var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var ActiveModel = require("../models/Active");
var ConnectionModel = require("../models/Connection");
var routeAuthentication = require("../middleware/authentication");

router.use(routeAuthentication);
var moment = require("moment");

module.exports = function(socket, nsp) {
  router.post("/getSurroundingPeople", async function(req, res) {
    var token = req.headers["token"];
    UserModel.createIndexes();
    var { currentlocation, startTime } = req.body;
    let location = {
      coordinates: currentlocation,
      type: "Point"
    };
    var userId;
    let updatedUser = await UserModel.findOneAndUpdate(
      { token: token },
      { $set: { location: location, updatedAt: new Date() } },
      { new: true }
    );
    if (updatedUser) {
      userId = updatedUser.id;
      console.log("location of user updated");
    } else {
      console.log("location of user not updated");
    }

    let radius = 91.44;
    startTime = moment(startTime).format("YYYY-MM-DD HH:mm:ss");
    UserModel.find(
      {
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: currentlocation
            },
            $maxDistance: radius
          }
        },
        token: { $not: { $eq: token } },
        updatedAt: { $lte: startTime }
      },
      async function(err, response) {
        if (response) {
          let modified_response = [];
          let alreadyFriend = false;

          let checkFriends = await ConnectionModel.findOne({ userId: userId });

          response.map(async obj => {
            let time = moment(obj.updatedAt).format("YYYY-MM-DD HH:mm:ss");
            console.log("time", time);

            if (checkFriends) {
              var check = checkFriends.active
                .map(a => a.emailAddress)
                .includes(obj.emailAddress);
            }
            if (check) {
              alreadyFriend = true;
            } else {
              alreadyFriend = false;
            }
            console.log("alreadyFriend", alreadyFriend);
            let new_obj = {
              firstName: obj.firstName,
              lastName: obj.lastName,
              location: {
                latitude: obj.location.coordinates[1],
                longitude: obj.location.coordinates[0]
              },
              id: obj._id,
              emailAddress: obj.emailAddress,
              address: obj.profile.address,
              publicAccount:
                alreadyFriend == true ? true : obj.profile.publicAccount,
              profilePicture: obj.profile.profilePicturePath,
              gender: obj.profile.gender,
              age: obj.profile.age,
              time: time
            };
            if (obj.profile.emailAddress) {
              modified_response.push(new_obj);
            }
          });

          if (modified_response) {
            let activeConnection = await ActiveModel.findOne({
              userId: userId
            });

            if (activeConnection) {
              let updatedConnection = await ActiveModel.findOneAndUpdate(
                { userId: userId },
                {
                  $set: { active: modified_response }
                }
              );
              if (updatedConnection) {
                console.log("connections updated");
              }
            } else {
              let obj = new ActiveModel({
                userId: userId,
                active: modified_response,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              let connection = await obj.save();
              if (connection) {
                console.log("connections added");
              }
            }
          }
          return res.json({
            status: 200,
            message: "people list fetched successfully",
            response: modified_response
          });
        } else if (err) {
          console.log("error getting all users", err);
          return res.json({
            status: 400,
            message: "error getting people list"
          });
        }
      }
    );
  });

  function Filters(ageFilter, genderFilter, timeFilter, firstNameFilter) {
    let filter = {};
    var lte;
    var gte;
    if (genderFilter && genderFilter !== "All") {
      filter = {
        ...filter,
        "active.gender": genderFilter
      };
    }
    if (ageFilter && ageFilter !== "All") {
      (gte = ageFilter.split("-")[0]), (gte = JSON.parse(gte));
      lte = ageFilter.split("-")[1];
      lte = JSON.parse(lte);
      filter = {
        ...filter,
        "active.age": { $lte: lte, $gte: gte }
      };
    }
    if (timeFilter && timeFilter !== "All") {
      var timeStr = `${timeFilter}:00:00`;
      timeStr = timeStr.split(":");
      var getTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      var h = timeStr[0],
        m = timeStr[1];
      s = timeStr[2];
      var newTime = moment(getTime)
        .subtract({ hours: h, minutes: m, seconds: s })
        .format("YYYY-MM-DD hh:mm:ss");
      console.log("newtime", newTime);

      filter = {
        ...filter,
        "active.time": { $gte: newTime }
      };
    }
    if (firstNameFilter) {
      filter = {
        ...filter,
        "active.firstName": firstNameFilter.toLowerCase()
      };
    }
    return filter;
  }

  router.post("/refineSearchPeople", async function(req, res) {
    var token = req.headers["token"];
    var { ageFilter, genderFilter, timeFilter, firstNameFilter } = req.body;

    var getUser = await UserModel.findOne({ token: token });
    let search = Filters(ageFilter, genderFilter, timeFilter, firstNameFilter);
    console.log(search);
    let connections = await ActiveModel.aggregate([
      { $match: { userId: getUser.id } },
      { $unwind: "$active" },
      { $match: search }
    ]);

    let modified_result = [];
    connections.map(obj => {
      modified_result.push(obj.active);
    });

    try {
      if (connections) {
        res.json({
          status: 200,
          message: "users fetched successfully",
          response: modified_result
        });
      }
    } catch (err) {
      console.log("error refining results", err);
      res.json({
        status: 400,
        message: "error refining results"
      });
    }
  });

  router.post("/refineConnectPeople/:id", async function(req, res) {
    var { ageFilter, genderFilter, timeFilter, firstNameFilter } = req.body;
    var { id } = req.params;

    let search = Filters(ageFilter, genderFilter, timeFilter, firstNameFilter);

    let filterConenctions = await ConnectionModel.aggregate([
      { $match: { userId: id } },
      { $unwind: "$active" },
      { $match: search }
    ]);

    let modified_response = [];
    filterConenctions.map(obj => {
      modified_response.push(obj.active);
    });

    try {
      if (filterConenctions) {
        res.json({
          status: 200,
          message: "users fetched successfully",
          response: modified_response
        });
      }
    } catch (err) {
      console.log("error refining results", err);
      res.json({
        status: 200,
        message: "error refining results"
      });
    }
  });

  return router;
};
