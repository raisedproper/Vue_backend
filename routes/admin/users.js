var express = require("express");
var router = express.Router();
var UserModel = require("../../models/User");

router.get("/getUsers", async function(req, res) {
  try {
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
  } catch (err) {
    res.json({
      status: 404,
      message: "error while fetching users"
    });
  }
});

router.put("/deleteUser/:id", async function(req, res) {
    try{
  var { id } = req.params;
  
  let user = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: { status: "deactive" } }
  );

  if (user) {
    console.log("user deactivated");
    res.json({
      status: 200,
      message: "user deactivated sucessfully"
    });
  } else {
    res.json({
      status: 400,
      message: "user not deactivated "
    });
  }
} catch(err){
    res.json({
        status: 404,
        message: "error while deactivating user"
      });
}
});

module.exports = router;
