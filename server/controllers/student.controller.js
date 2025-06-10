import Group from "../models/Group.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import TaskCompletion from "../models/TaskCompletion.js";

// View the group(s) the logged-in student is in
export async function viewMyGroup(req, res) {
  try {
    const studentId = req.session.user._id;
    // Find all groups this student is a member of
    const groups = await Group.find({ "members.studentId": studentId })
      .populate("members.studentId")
      .populate("projectId")
      .lean();
    const completions = await TaskCompletion.find({}).lean();
    // Calculate group progress
    const groupProgress = {};
    groups.forEach(group => {
      // Unique tasks assigned to the group
      const assignedTaskIds = [...new Set(group.groupTaskAssignments.map(a => a.taskId.toString()))];
      // Completed assignments (per member)
      const completed = group.groupTaskAssignments.filter(a =>
        completions.some(c => c.studentId.toString() === a.studentId.toString() && c.taskId.toString() === a.taskId.toString())
      ).length;
      groupProgress[group._id.toString()] = {
        completed,
        total: assignedTaskIds.length,
        percent: assignedTaskIds.length ? Math.round((completed / assignedTaskIds.length) * 100) : 0,
        members: group.members // pass all members for display
      };
    });
    res.render("student/group", { groups, groupProgress });
  } catch (err) {
    res.render("student/group", { error: "Could not load your group(s)" });
  }
}

// View the projects and tasks assigned to the student's group(s)
export async function viewMyProjectsTasks(req, res) {
  try {
    const studentId = req.session.user._id;
    const groups = await Group.find({ "members.studentId": studentId })
      .populate({ path: "projectId" })
      .lean();
    const projects = groups.map(g => g.projectId).filter(Boolean);
    // Get all completions for this student
    const completions = await TaskCompletion.find({ studentId }).lean();
    const completedTaskIds = completions.map(c => c.taskId.toString());
    // Mark only assigned tasks as completed
    for (const group of groups) {
      if (!group.projectId) continue;
      const myAssignments = group.groupTaskAssignments.filter(a => a.studentId.toString() === studentId);
      const myTaskIds = myAssignments.map(a => a.taskId.toString());
      for (const project of projects) {
        if (project._id.toString() === group.projectId._id.toString()) {
          for (const task of project.tasks) {
            task.completed = myTaskIds.includes(task._id.toString()) && completedTaskIds.includes(task._id.toString());
            task.assigned = myTaskIds.includes(task._id.toString());
          }
        }
      }
    }
    // Only show assigned tasks
    for (const project of projects) {
      project.tasks = project.tasks.filter(t => t.assigned);
    }
    res.render("student/projects", { projects });
  } catch (err) {
    res.render("student/projects", { error: "Could not load your projects/tasks" });
  }
}

// Mark a task as complete
export async function completeTask(req, res) {
  try {
    const studentId = req.session.user._id;
    const { taskId, projectId } = req.body;
    // Prevent duplicate completions
    const exists = await TaskCompletion.findOne({ studentId, taskId });
    if (!exists) {
      await TaskCompletion.create({ studentId, taskId, projectId });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not mark task as complete" });
  }
}

// Leaderboard
export async function viewLeaderboard(req, res) {
  try {
    const selectedProjectId = req.query.projectId || "";
    // Get all students
    const students = await User.find({ role: "student" }).lean();
    // Get all groups
    const groups = await Group.find({}).populate("members.studentId").populate("projectId").lean();
    // Get all projects and tasks
    const projects = await Project.find({}).lean();
    // Get all completions
    const completions = await TaskCompletion.find({}).lean();

    // Filter by selected project if provided
    const filteredGroups = selectedProjectId ? groups.filter(g => g.projectId && g.projectId._id.toString() === selectedProjectId) : groups;
    const filteredProjectIds = filteredGroups.map(g => g.projectId?._id?.toString()).filter(Boolean);
    const filteredProjects = selectedProjectId ? projects.filter(p => p._id.toString() === selectedProjectId) : projects;

    // Map: studentId -> { completed: n, total: n }
    const studentStats = {};
    for (const student of students) {
      // Find all projects this student is in (via group)
      const studentGroups = filteredGroups.filter(g => g.members.some(m => m.studentId && m.studentId._id.toString() === student._id.toString()));
      const projectIds = studentGroups.map(g => g.projectId?._id?.toString()).filter(Boolean);
      const tasks = filteredProjects.filter(p => projectIds.includes(p._id.toString())).flatMap(p => p.tasks || []);
      const completed = completions.filter(c => c.studentId.toString() === student._id.toString() && (!selectedProjectId || filteredProjectIds.includes(c.projectId.toString()))).length;
      studentStats[student._id] = {
        name: student.name,
        group: studentGroups[0]?.name || studentGroups[0]?.projectId?.title || "N/A",
        groupId: studentGroups[0]?._id?.toString() || "",
        completed,
        total: tasks.length,
        percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
      };
    }

    // Map: groupId -> { completed: n, total: n }
    const groupStats = {};
    for (const group of filteredGroups) {
      // Get all unique taskIds assigned to this group (from groupTaskAssignments)
      const assignedTaskIds = [...new Set(group.groupTaskAssignments.map(a => a.taskId.toString()))];
      // Get all completions for this group
      const completed = group.groupTaskAssignments.filter(a =>
        completions.some(c => c.studentId.toString() === a.studentId.toString() && c.taskId.toString() === a.taskId.toString())
      ).length;
      groupStats[group._id] = {
        name: group.name || group.projectId?.title || "N/A",
        completed,
        total: assignedTaskIds.length,
        percent: assignedTaskIds.length ? Math.round((completed / assignedTaskIds.length) * 100) : 0
      };
    }

    res.render("student/leaderboard", {
      studentStats: Object.values(studentStats),
      groupStats: Object.values(groupStats),
      allProjects: projects,
      selectedProjectId
    });
  } catch (err) {
    res.render("student/leaderboard", { error: "Could not load leaderboard" });
  }
}

export async function viewGroupLeaderboard(req, res) {
  const { groupId } = req.params;
  const group = await Group.findById(groupId)
    .populate("members.studentId")
    .populate("projectId")
    .lean();
  const completions = await TaskCompletion.find({}).lean();
  // For each member, show assigned tasks and completion
  const memberStats = group.members.map(m => {
    const assignments = group.groupTaskAssignments.filter(a => a.studentId.toString() === m.studentId._id.toString());
    const assignedTaskIds = assignments.map(a => a.taskId.toString());
    const completed = completions.filter(c => c.studentId.toString() === m.studentId._id.toString() && assignedTaskIds.includes(c.taskId.toString())).length;
    return {
      name: m.studentId.name,
      completed,
      total: assignedTaskIds.length,
      percent: assignedTaskIds.length ? Math.round((completed / assignedTaskIds.length) * 100) : 0
    };
  });
  res.render("student/group_leaderboard", { group, memberStats });
} 