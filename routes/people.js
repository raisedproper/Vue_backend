var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");
/* GET home page. */
router.use(routeAuthentication);
var date = new Date();
var moment = require('moment');

async function findUser(postdata) {
  let response = await UserModel.find(postdata);
  if (response) {
    let obj = {
      status: 200,
      response: response
    };
    return obj;
  } else if (!response) {
    let obj = {
      status: 400
    };
    return obj;
  } else if (err) {
    let obj = { status: 404, response: err };
    return obj;
  }
}

var kmToRadian = function(km){
  var earthRadiusInkm = 6371;
  return km / earthRadiusInkm;
};

router.post("/getSurroundingPeople",async function(req, res) {
  var token = req.headers["token"];
  UserModel.createIndexes()
  var {currentlocation,startTime,endTime} = req.body
  let location = {
    "coordinates": currentlocation,
    "type": "Point"
}
  let updatedUser = await UserModel.findOneAndUpdate(
    { token: token },
    { $set: { location: location, updatedAt: date } },
    { new: true }
  );
  if (updatedUser) {
    console.log('location of user updated')
  } else {
    console.log("location of user not updated")
  }

let radius = 91.44
/* console.log('start',startTime)
console.log('end',endTime) */
/* startTime = moment(startTime).format('LT') */
/* console.log('startTime',startTime) */
/* endTime = moment(endTime).format('LT') */
/* console.log('endTime',endTime) */
  UserModel.find(
    {
       "location": { 
         $nearSphere: { 
           $geometry: { 
             type: "Point", coordinates: currentlocation
            }, 
            $maxDistance: radius
          } },
       token: { $not: { $eq: token } }, 
      /* "updatedAt": {$gte: startTime, $lt: endTime}  */
    },
    function(err, response) {
      if (response) {
        console.log("get all users");
        let modified_response = [];
        response.map(obj => {
          let time =  moment(obj.updatedAt).format('LT')
          console.log('time',time)

          let new_obj = {
            firstName: obj.firstName,
            lastName: obj.lastName,
            location: {latitude: obj.location.coordinates[1], longitude: obj.location.coordinates[0]},
            id: obj._id,
            emailAddress: obj.emailAddress,
            address: obj.profile.address,
            publicAccount: obj.profile.publicAccount,
            profilePicture: obj.profile.profilePicturePath,
            gender: obj.profile.gender,
            time: time
          };
          if (obj.profile.emailAddress) {
            modified_response.push(new_obj);
          }
        });
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

router.post("/refineSearchPeople", function(req, res) {
  var token = req.headers["token"];
  var {
    ageFilter,
    genderFilter,
    timeFilter,
    firstNameFilter,
    lastNameFilter
  } = req.body;
  console.log("fsgfs", ageFilter);
  console.log("sfsd", ageFilter.split("-")[0]);

  UserModel.find(
    {
      "profile.age": {
        $gte: ageFilter.split("-")[0],
        $lt: ageFilter.split("-")[1]
      },
      "profile.gender": genderFilter,
      "profile.time": {
        $gte: timeFilter.split("-")[0],
        $lt: timeFilter.split("-")[1]
      },
      firstName: firstNameFilter,
      lastName: lastNameFilter
    },
    function(err, response) {
      if (response) {
        console.log("get users", response);
        res.json({
          status: 200,
          message: "users fetched successfully",
          response: response
        });
      } else if (err) {
        console.log("error getting all users", err);
        res.json({
          status: 400,
          message: "error getting all users"
        });
      }
    }
  );
});

module.exports = router;
