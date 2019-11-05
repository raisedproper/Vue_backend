var express = require("express");
var router = express.Router();
var UserModel = require("../../models/User");

router.get("/getUsers", async function(req, res) {
  var users = await UserModel.find();
  if (users) {
    res.json({
      status: 200,
      message: "users fetched successfully",
      response: users
    });
  } else {
    res.json({
      status: 400,
      message: "no users"
    });
  }
});

router.put("/deleteUser/:id", async function(req, res) {
  var { id } = req.params;
console.log('sf',id)
  let user = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: { status: "deactive" } }
  );

  if (user) {
    console.log("user deactivated");
  }
});

module.exports = router;
