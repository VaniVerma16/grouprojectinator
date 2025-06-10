import express from "express";

import {
  renderCreateClassForm,
  createClass,
  viewClass,
  viewTeacherClass,
  renderAssignStudentsForm,
  assignStudents,
} from "../controllers/class.controller.js";

const router = express.Router();

router.get("/class/create", renderCreateClassForm);
router.post("/class/create", createClass);

router.get("/class/:classId/view", viewClass);

router.get("/class/:classId/assign", renderAssignStudentsForm);
router.post("/class/:classId/assign", assignStudents);

router.get("/class/create", renderCreateClassForm);
router.post("/class/create", createClass);
router.get("/class/manage", viewTeacherClass);

export default router;
