const express = require("express");
const router = express.Router();
const JoinMeeting = require("../models/joinmetting");
const wrapAsync = require("../middlewares/wrapAsync");

router.get("/", (req, res) => {
  res.render("homepage.ejs");
});

router.get("/meeting-code", wrapAsync, async (req, res, next) => {
  const meetingHistory = await JoinMeeting.find({});
  res.render("get-meeting.ejs", { meetingHistory });
});

router.post("/meeting-code", wrapAsync, async (req, res, next) => {
  const { meetingCode } = req.body;
  let newMeetingCode = new JoinMeeting({
    meetingCode: meetingCode,
  });
  await newMeetingCode.save();
  console.log(`meetingcode: ${newMeetingCode}`);
  res.redirect(`/videocall/${meetingCode}`);
});

router.get("/videocall/:id", (req, res) => {
  res.render("video-stream.ejs");
});

module.exports = router;
