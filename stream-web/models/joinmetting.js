const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const meetingSchema = new Schema({
  meetingCode: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const Meeting = mongoose.model("Metting", meetingSchema);

module.exports = Meeting;
