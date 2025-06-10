import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  weightage: { type: Number, required: true },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tasks: [taskSchema],
  groups: [
    {
      leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  ],
});

export default mongoose.model("Project", projectSchema);
