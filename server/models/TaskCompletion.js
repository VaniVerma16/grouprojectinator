import mongoose from "mongoose";
const taskCompletionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  completedAt: { type: Date, default: Date.now }
});
export default mongoose.model("TaskCompletion", taskCompletionSchema); 