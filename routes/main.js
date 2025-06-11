const express = require("express");
const router = express.Router();
const JoinMeeting = require("../models/joinmetting");

router.get("/", (req, res) => {
  res.render("homepage.ejs");
});

router.get("/meetingId", async (req, res) => {
  const meetingHistory = await JoinMeeting.find({});
  res.render("get-meeting.ejs", { meetingHistory });
});

router.post("/meetingId", async (req, res) => {
  const { meetingCode } = req.body;
  let newMeetingCode = new JoinMeeting({
    meetingCode: meetingCode,
  });
  await newMeetingCode.save();
  console.log(`meetingcode: ${newMeetingCode}`);
  res.redirect(`/${meetingCode}`);
});

router.get("/:id", (req, res) => {
  res.render("video-stream.ejs");
});

module.exports = router;
