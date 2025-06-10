import express from "express";
import { isTeacher, isStudent } from "../middleware/auth.js";
import { viewMyGroup, viewMyProjectsTasks, completeTask, viewLeaderboard, viewGroupLeaderboard } from "../controllers/student.controller.js";
const router = express.Router();

router.get("/dashboard/teacher", isTeacher, (req, res) => {
  res.render("dashboard/teacher");
});

router.get("/dashboard/student", isStudent, (req, res) => {
  res.render("dashboard/student");
});

// Student: View My Group
router.get("/dashboard/student/group", isStudent, viewMyGroup);
// Student: View My Projects & Tasks
router.get("/dashboard/student/projects", isStudent, viewMyProjectsTasks);
// Student: Mark Task as Complete
router.post("/dashboard/student/complete-task", isStudent, completeTask);
// Student: View Leaderboard
router.get("/leaderboard", isStudent, viewLeaderboard);
// Student: View Group Leaderboard Details
router.get("/leaderboard/group/:groupId", isStudent, viewGroupLeaderboard);

export default router;
