import Project from "../models/Project.js";
import Class from "../models/Class.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

export const viewGroupsForProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId).lean();

    const groups = await Group.find({ projectId })
      .populate("members.studentId")
      .lean();

    res.render("group/view", { project, groups });
  } catch (err) {
    res.status(500).send("Error loading groups");
  }
};

export const renderGroupAssignForm = async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId).lean();
  const classData = await Class.findById(project.classId)
    .populate("students")
    .lean();

  res.render("group/assign", { project, classData });
};

export const renderJoinGroupForm = (req, res) => {
  res.render("group/join");
};

export const joinGroup = async (req, res) => {
  const studentId = "STUDENT_ID_FROM_SESSION";
  const { joinCode } = req.body;

  const group = await Group.findOne({ joinCode, isJoinable: true });

  if (!group) {
    return res.render("group/join", {
      error: "Invalid or expired group code.",
    });
  }

  // Check if already in group
  const alreadyMember = group.members.some(
    (m) => m.studentId.toString() === studentId
  );
  if (alreadyMember) {
    return res.redirect("/dashboard/student");
  }

  group.members.push({ studentId, isLeader: false });
  await group.save();

  res.redirect("/dashboard/student");
};

export const assignGroups = async (req, res) => {
    const { projectId } = req.params;
    const { groupMembers = {}, groupLeader = {} } = req.body;
  
    try {
      for (const index in groupMembers) {
        const members = Array.isArray(groupMembers[index])
          ? groupMembers[index]
          : [groupMembers[index]];
  
        const leader = groupLeader[index];
  
        const formatted = members.map(studentId => ({
          studentId,
          isLeader: studentId === leader
        }));
  
        await Group.create({ projectId, members: formatted });
      }
  
      res.redirect(`/project/${projectId}/view-groups`);
    } catch (err) {
      console.error("Group creation failed:", err);
      res.status(500).send("Failed to assign groups");
    }
  };
