import Class from "../models/Class.js";
import User from "../models/User.js";

export const renderCreateClassForm = (req, res) => {
  res.render("class/create");
};

export const createClass = async (req, res) => {
  const { name, description } = req.body;

  try {
    const teacherId = "683d43d972d8fe1ac0c6f73c";
    await Class.create({ name, description, teacherId });
    res.redirect("/dashboard/teacher");
  } catch (err) {
    res.render("class/create", { error: "Error creating class" });
  }
};
export const viewTeacherClass = async (req, res) => {
  try {
    const teacherId = "683d43d972d8fe1ac0c6f73c"; // later: from session
    const classes = await Class.find({ teacherId }).lean();

    res.render("class/manage", { classes });
  } catch (err) {
    res.render("dashboard/teacher", { error: "Unable to load classes" });
  }
};

export const viewClass = async (req, res) => {
  const { classId } = req.params;
  const classData = await Class.findById(classId).populate("students").lean();
  res.render("class/view", { classData });
};

export const renderAssignStudentsForm = async (req, res) => {
  const { classId } = req.params;

  try {
    const classData = await Class.findById(classId).lean();
    const students = await User.find({ role: "student" }).lean();
    const studentsWithAssignment = students.map(s => ({
      ...s,
      alreadyAssigned: !!s.classId && s.classId.toString() !== classId
    }));
    res.render("class/assign", { classData, students: studentsWithAssignment });
  } catch (err) {
    res.render("class/manage", { error: "Failed to load students" });
  }
};

export const assignStudents = async (req, res) => {
  const { classId } = req.params;
  const { selectedStudents } = req.body;

  try {
    await Class.findByIdAndUpdate(classId, {
      $addToSet: {
        students: {
          $each: Array.isArray(selectedStudents)
            ? selectedStudents
            : [selectedStudents],
        },
      },
    });

    res.redirect("/class/manage");
  } catch (err) {
    res.render("class/manage", { error: "Failed to assign students" });
  }
};
