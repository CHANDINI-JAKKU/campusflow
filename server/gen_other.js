import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = [
  'User', 'Institution', 'Department', 'Course', 'Subject', 
  'Enrollment', 'Attendance', 'AttendanceRecord', 'Assignment', 
  'AssignmentSubmission', 'Grade', 'AcademicRecord', 'Event', 
  'Announcement', 'StudentRequest', 'Notification', 'Company', 
  'JobDrive', 'JobApplication', 'InterviewRound', 'PlacementOutcome', 
  'File', 'ActivityLog', 'RefreshToken', 'PasswordResetToken', 
  'AIConversation', 'StudyPlan'
];

models.forEach(model => {
  const controllerCode = "import " + model + " from '../models/" + model + ".js';\n\n" +
"export const create = async (req, res, next) => {\n" +
"  try {\n" +
"    const doc = await " + model + ".create(req.body);\n" +
"    res.status(201).json({ success: true, data: doc });\n" +
"  } catch (error) { next(error); }\n" +
"};\n\n" +
"export const getAll = async (req, res, next) => {\n" +
"  try {\n" +
"    const docs = await " + model + ".find(req.query || {});\n" +
"    res.status(200).json({ success: true, data: docs });\n" +
"  } catch (error) { next(error); }\n" +
"};\n\n" +
"export const getOne = async (req, res, next) => {\n" +
"  try {\n" +
"    const doc = await " + model + ".findById(req.params.id);\n" +
"    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });\n" +
"    res.status(200).json({ success: true, data: doc });\n" +
"  } catch (error) { next(error); }\n" +
"};\n\n" +
"export const update = async (req, res, next) => {\n" +
"  try {\n" +
"    const doc = await " + model + ".findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });\n" +
"    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });\n" +
"    res.status(200).json({ success: true, data: doc });\n" +
"  } catch (error) { next(error); }\n" +
"};\n\n" +
"export const remove = async (req, res, next) => {\n" +
"  try {\n" +
"    const doc = await " + model + ".findByIdAndDelete(req.params.id);\n" +
"    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });\n" +
"    res.status(200).json({ success: true, data: {} });\n" +
"  } catch (error) { next(error); }\n" +
"};\n";

  fs.writeFileSync(path.join(__dirname, 'controllers', model.toLowerCase() + 'Controller.js'), controllerCode);
});

models.forEach(model => {
  const routeCode = "import express from 'express';\n" +
"import * as " + model + "Controller from '../controllers/" + model.toLowerCase() + "Controller.js';\n\n" +
"const router = express.Router();\n\n" +
"router.route('/')\n" +
"  .post(" + model + "Controller.create)\n" +
"  .get(" + model + "Controller.getAll);\n\n" +
"router.route('/:id')\n" +
"  .get(" + model + "Controller.getOne)\n" +
"  .patch(" + model + "Controller.update)\n" +
"  .delete(" + model + "Controller.remove);\n\n" +
"export default router;\n";
  
  fs.writeFileSync(path.join(__dirname, 'routes', model.toLowerCase() + 's.js'), routeCode);
});

console.log('Controllers and Routes generated');
