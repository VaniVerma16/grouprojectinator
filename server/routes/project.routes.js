import express from "express";

import {
  renderCreateProjectForm,
  createProject,
  assignGroupsToProject,
  viewProjects,
  viewGroupsForProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.get("/project/create", renderCreateProjectForm);
router.post("/project/create", createProject);
router.get("/project/list", viewProjects);
router.post("/project/:projectId/assign-groups", assignGroupsToProject);

router.get("/project/:projectId/view-groups", viewGroupsForProject);

export default router;
