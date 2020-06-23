var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var UserLocationModel = require("../models/UserLocation");

var ActiveModel = require("../models/Active");
var ConnectionModel = require("../models/Connection");

var routeAuthentication = require("../middleware/authentication");
var mongoose = require("mongoose");
router.use(routeAuthentication);
var moment = require("moment");

function toUpper(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

module.exports = function(soc, nsp) {
  // router.post("/getSurroundingPeople", async function(req, res) {
  //   var { currentlocation, userId } = req.body;

  //   let location = {
  //     coordinates: currentlocation,
  //     type: "Point"
  //   };

  //   let updatedUser = await UserModel.findOneAndUpdate(
  //     { _id: mongoose.Types.ObjectId(userId) },
  //     { $set: { location: location, updatedAt: new Date() } },
  //     { new: true }
  //   );
  //   if (updatedUser) {
  //     token = updatedUser.token;
  //     console.log("location of user updated", userId);
  //   } else {
  //     console.log("location of user not updated");
  //   }

  //   UserModel.createIndexes();
  //   let radius = 91.44;

  //   let startTime = moment().format("YYYY-MM-DD HH:mm:ss");
  //   console.log("starttime", startTime);
  //   let response = await UserModel.find({
  //     location: {
  //       $nearSphere: {
  //         $geometry: {
  //           type: "Point",
  //           coordinates: currentlocation
  //         },
  //         $maxDistance: radius
  //       }
  //     },
  //     id: { $not: { $eq: userId } },
  //     updatedAt: { $lte: startTime }
  //   });
  //   if (response) {
  //     console.log("resp", response);
  //     let modified_response = [];
  //     let alreadyFriend = false;

  //     let checkFriends = await ConnectionModel.findOne({
  //       userId: userId
  //     });

  //     response.map(async obj => {
  //       let time = moment(obj.updatedAt).format("YYYY-MM-DD HH:mm:ss");

  //       if (checkFriends) {
  //         var check = checkFriends.active
  //           .map(a => a.emailAddress)
  //           .includes(obj.emailAddress);
  //       }
  //       if (check) {
  //         alreadyFriend = true;
  //       } else {
  //         alreadyFriend = false;
  //       }

  //       let new_obj = {
  //         firstName: obj.firstName,
  //         lastName: obj.lastName,
  //         location: {
  //           latitude: obj.location.coordinates[1],
  //           longitude: obj.location.coordinates[0]
  //         },
  //         id: obj._id,
  //         emailAddress: obj.emailAddress,
  //         address: obj.profile.address,
  //         publicAccount:
  //           alreadyFriend == true ? true : obj.profile.publicAccount,
  //         profilePicture: obj.profile.profilePicturePath,
  //         gender: obj.profile.gender,
  //         age: obj.profile.age,
  //         token: obj.token,
  //         time: time
  //       };

  //       if (obj.profile.emailAddress) {
  //         modified_response.push(new_obj);
  //       }
  //     });

  //     if (modified_response) {
  //       let activeConnection = await ActiveModel.findOne({
  //         userId: userId
  //       });

  //       if (activeConnection) {
  //         let updatedConnection = await ActiveModel.findOneAndUpdate(
  //           { userId: userId },
  //           {
  //             $set: { active: modified_response }
  //           }
  //         );
  //         if (updatedConnection) {
  //           console.log("connections updated");
  //         }
  //       } else {
  //         let obj = new ActiveModel({
  //           userId: userId,
  //           active: modified_response,
  //           createdAt: new Date(),
  //           updatedAt: new Date()
  //         });
  //         let connection = await obj.save();
  //         if (connection) {
  //           console.log("connections added");
  //         }
  //       }
  //     }

  //     if (modified_response.length == 0) {
  //       res.json({
  //         status: 200,
  //         message: "no people found",
  //         response: modified_response
  //       });
  //     } else {
  //       res.json({
  //         status: 200,
  //         message: "people list fetched successfully",
  //         response: modified_response
  //       });
  //     }
  //   } else if (!response) {
  //     console.log("error getting all users", err);
  //     res.json({
  //       status: 400,
  //       message: "error getting people list"
  //     });
  //   }
  // });






  router.post("/getSurroundingPeople", async function(req, res) {
    var { latitude,longitude, emailAddress,datetime } = req.body;

    emailAddress = toUpper(emailAddress);

   
    let radius = 91.44;

    let startTime = moment().format("YYYY-MM-DD HH:mm:ss");
    console.log("starttime", startTime);


   
    let response = await UserLocationModel.find({
      emailAddress: { $not: { $eq: emailAddress } },
      "createdAt":{$gt:new Date(Date.now() - 24*60*60 * 1000)},

    })

    if (response) {
      console.log("resp", response);
     
      var modified_userEmail = [];
      let alreadyFriend = false;

     response.map( obj => {
        let time = moment(obj.updatedAt).format("YYYY-MM-DD HH:mm:ss");
        let lat2 = obj.latitude;
        let lon2 = obj.longitude;
        let lat1 = latitude;
        let lon1 = longitude;

        let distance1 = distance(lat1,lon1,lat2,lon2,'Meter')
      

       if(distance1 <= 100)
       {
        modified_userEmail.push(obj.emailAddress);
       }
       else{

        }
          
      
  });

  console.log('modified_userEmail' +' '+modified_userEmail);
  modified_userEmail = [ ...new Set(modified_userEmail)]  
  console.log('modified_userEmail' +' '+modified_userEmail);


  
        let userResultResponse = await UserModel.find({
          emailAddress:  {
            $in: modified_userEmail
        } })

        // console.log('distance' +' '+distance1);
         console.log("modified_userEmail"+modified_userEmail);
        console.log("error refining results"+userResultResponse);
        // modified_userEmail.push('lllllll');   

  res.json({
    status: 200,
    message: "User Data Show",
    response:userResultResponse
  });

    }

else{
  res.json({
    status: 400,
    message: "error refining results"
  });
}


    
  });


  function distance(lat1, lon1, lat2, lon2, unit) {

    //unit = the unit you desire for results                              
    //:::           where: 'M' is statute miles (default)                        
    //:::                  'K' is kilometers                                      
    //:::                  'N' is nautical miles 
    //:::          'Meter' is Meter

    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      if (unit=="Meter") { dist = dist * 1.609344*1000 }
      return dist;
    }
  }




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
    try {
      var token = req.headers["token"];
      var { ageFilter, genderFilter, timeFilter, firstNameFilter } = req.body;

      genderFilter = toUpper(genderFilter);
      firstNameFilter = toUpper(firstNameFilter);

      var getUser = await UserModel.findOne({ token: token });
      let search = Filters(
        ageFilter,
        genderFilter,
        timeFilter,
        firstNameFilter
      );
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
    try {
      var { ageFilter, genderFilter, timeFilter, firstNameFilter } = req.body;
      var { id } = req.params;
      genderFilter = toUpper(genderFilter);
      firstNameFilter = toUpper(firstNameFilter);
      let search = Filters(
        ageFilter,
        genderFilter,
        timeFilter,
        firstNameFilter
      );

      let filterConenctions = await ConnectionModel.aggregate([
        { $match: { userId: id } },
        { $unwind: "$active" },
        { $match: search }
      ]);

      let modified_response = [];
      filterConenctions.map(obj => {
        modified_response.push(obj.active);
      });

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
