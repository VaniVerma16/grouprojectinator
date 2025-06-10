import mongoose from "mongoose";

const groupMemberSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isLeader: { type: Boolean, default: false },
});

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  members: [groupMemberSchema],
  joinCode: { type: String }, // unique code if joinable
  isJoinable: { type: Boolean, default: false }, // true for student-chosen groups
  groupTaskAssignments: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    taskId: { type: mongoose.Schema.Types.ObjectId }
  }]
});

export default mongoose.model("Group", groupSchema);
