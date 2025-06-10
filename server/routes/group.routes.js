import express from "express";
import {
  renderGroupAssignForm,
  renderJoinGroupForm,
  joinGroup,
  viewGroupsForProject,
} from "../controllers/group.controller.js";

const router = express.Router();
router.get("/project/:projectId/view-groups", viewGroupsForProject);
router.get("/project/:projectId/assign-groups", renderGroupAssignForm);
router.post("/group/join", joinGroup);

export default router;
