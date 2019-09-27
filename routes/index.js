var express = require("express");
var router = express.Router();
var PeopleModel = require("../models/People");
var UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const config = require("../config");

/* GET home page. */

router.get("/", function(req, res) {
  res.render("index");
});

router.get("/verifyEmail", function(req, res) {
  res.render("verificationResponse");
});

 router.put("/getuser/:id", async function(req, res) {
  const {id} = req.params
  
  let user = await PeopleModel.findById(id).populateAssociation('friend')
  res.send(user)
}) 

router.get("/getSurroundingPeople", function(req, res) {
  var token = req.headers["token"];
  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }
  PeopleModel.find({}, function(err, response) {
    if (response ) {
      console.log("get all users", response);
      res.status(200).json(response);
    }else if (err) {
      console.log("error getting all users", err);
      res.status(400).json(err);
    }
  });
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
  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  }

  var filter = {};
  if (ageFilter) {
    filter.age = ageFilter;
  }
  if (genderFilter) {
    filter.gender = genderFilter;
  }
  if (timeFilter) {
    filter.time = timeFilter;
  }
  if (firstNameFilter) {
    filter.firstName = firstNameFilter;
  }
  if (lastNameFilter) {
    filter.lastName = lastNameFilter;
  }
  console.log(filter);
  PeopleModel.find(filter, function(err, response) {
    if (response ) {
      console.log("get users", response);
      res.status(200).json(response);
    } else if (err) {
      console.log("error getting all users", err);
      res.status(400).json(err);
    }
  });
});

module.exports = router;
