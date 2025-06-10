import Class from "../models/Class.js";
import Project from "../models/Project.js";
import Group from "../models/Group.js";

export const renderCreateProjectForm = async (req, res) => {
  const teacherId = "683d43d972d8fe1ac0c6f73c";

  const classes = await Class.find({ teacherId }).lean();
  res.render("project/create", { classes });
};

export const createProject = async (req, res) => {
  const { title, description, classId } = req.body;
  const teacherId = "683d43d972d8fe1ac0c6f73c";

  let tasks = [];
  const taskTitles = req.body.taskTitle;

  if (Array.isArray(taskTitles)) {
    const weightage = 100 / taskTitles.length;
    tasks = taskTitles.map(t => ({ title: t, weightage }));
  } else if (taskTitles) {
    tasks = [{ title: taskTitles, weightage: 100 }];
  }

  try {
    await Project.create({ title, description, classId, teacherId, tasks });
    res.redirect("/dashboard/teacher");
  } catch (err) {
    res.render("project/create", { error: "Failed to create project" });
  }
};

export const viewProjects = async (req, res) => {
  const teacherId = "683d43d972d8fe1ac0c6f73c";
  const projects = await Project.find({ teacherId }).lean();
  res.render("project/list", { projects });
};

export const viewGroupsForProject = async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId).lean();
  const groups = await Group.find({ projectId })
    .populate("members.studentId")
    .lean();

  res.render("group/view", { project, groups });
};

export const assignGroupsToProject = async (req, res) => {
  const { projectId } = req.params;
  const { groupMembers, groupLeader } = req.body;

  console.log("Received group data:", { groupMembers, groupLeader });

  if (!groupMembers || !groupLeader || Object.keys(groupMembers).length === 0) {
    console.error("Invalid group data received:", req.body);
    return res.status(400).json({ error: "Invalid group data" });
  }

  try {
    // First, delete any existing groups for this project
    await Group.deleteMany({ projectId });

    // Create new groups
    const groupIndexes = Object.keys(groupMembers);
    const groupPromises = groupIndexes.map(async (groupIndex, idx) => {
      const members = Array.isArray(groupMembers[groupIndex])
        ? groupMembers[groupIndex]
        : [groupMembers[groupIndex]];

      const leader = groupLeader[groupIndex];

      if (!leader || !members.includes(leader)) {
        throw new Error(`Invalid leader for group ${groupIndex}`);
      }

      const formattedMembers = members.map((studentId) => ({
        studentId,
        isLeader: studentId === leader,
      }));

      // Randomly assign each task to exactly one member
      const project = await Project.findById(projectId).lean();
      const tasks = project.tasks || [];
      let assignments = [];
      if (members.length === 1) {
        // Only one member, assign all tasks to them
        assignments = tasks.map(task => ({ studentId: members[0], taskId: task._id }));
      } else {
        // Distribute tasks among members (round-robin)
        const membersShuffled = [...members].sort(() => Math.random() - 0.5);
        assignments = tasks.map((task, i) => ({
          studentId: membersShuffled[i % membersShuffled.length],
          taskId: task._id
        }));
      }

      return Group.create({
        name: `Group ${idx + 1}`,
        projectId,
        members: formattedMembers,
        groupTaskAssignments: assignments
      });
    });

    await Promise.all(groupPromises);
    console.log("Successfully created groups for project:", projectId);

    // Send success response
    res.json({ success: true, redirect: `/project/${projectId}/view-groups` });
  } catch (err) {
    console.error("Error assigning groups:", err);
    res.status(500).json({ 
      error: "Failed to assign groups",
      details: err.message 
    });
  }
};
