var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var ActiveModel = require("../models/Active");
var routeAuthentication = require("../middleware/authentication");

router.use(routeAuthentication);
var date = new Date();
var moment = require("moment");

var kmToRadian = function(km) {
  var earthRadiusInkm = 6371;
  return km / earthRadiusInkm;
};

router.post("/getSurroundingPeople", async function(req, res) {
  var token = req.headers["token"];
  UserModel.createIndexes();
  var { currentlocation, startTime, endTime } = req.body;
  let location = {
    coordinates: currentlocation,
    type: "Point"
  };
  var userId;
  let updatedUser = await UserModel.findOneAndUpdate(
    { token: token },
    { $set: { location: location, updatedAt: date } },
    { new: true }
  );
  if (updatedUser) {
    userId = updatedUser.id;
    console.log("location of user updated");
  } else {
    console.log("location of user not updated");
  }

  let radius = 91.44;
  /* console.log('start',startTime)
console.log('end',endTime) */
  /* startTime = moment(startTime).format('LT') */
  /* console.log('startTime',startTime) */
  /* endTime = moment(endTime).format('LT') */
  /* console.log('endTime',endTime) */
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
      token: { $not: { $eq: token } }
      /* "updatedAt": {$gte: startTime, $lt: endTime}  */
    },
    async function(err, response) {
      if (response) {
        console.log("get all users");
        let modified_response = [];
        response.map(async obj => {
          let time = moment(obj.updatedAt).format("LT");
          /* let checkFriends = await PeopleModel.find({
  $or: [{ senderId: userId, recieverId: obj.id}, {senderId: obj.id,recieverId: userId }]
})
console.log('check if friends',checkFriends) */

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
            publicAccount: obj.profile.publicAccount,
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
          let activeConnection = await ActiveModel.findById(userId);
          console.log("active", activeConnection);
          if (activeConnection) {
            let updatedConnection = await ActiveModel.findOneAndUpdate(
              { id: userId },
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
              createdAt: date,
              updatedAt: date
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

router.post("/refineSearchPeople", async function(req, res) {
  var token = req.headers["token"];
  var { ageFilter, genderFilter, timeFilter, firstNameFilter } = req.body;

  var lte;
  var gte;
  let filter = {};
  let getUser = await UserModel.findOne({ token: token });
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
    time = moment(date).format("h:mm:ss ");
    timeFilter = '3:00:00'
    var duration = moment.duration({hours: 3, minutes: 00, seconds: 00})
    var sub = moment(time, 'h:mm:ss').subtract(duration).format('LT');

    console.log("duration", sub);
   /*  let hours = moment(sub).format('LT') */
     filter = {
      ...filter,
      "active.time": { $lte: sub }
    }; 
  }

  console.log("filter", filter);
  let connections = await ActiveModel.aggregate([
    { $match: { userId: getUser.id } },
    { $unwind: "$active" },
    { $match: filter }
  ]);

  res.send(connections);
});

module.exports = router;
