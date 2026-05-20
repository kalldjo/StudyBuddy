const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/", projectController.createProject);
router.put("/:id", projectController.updateProject);
router.get("/", projectController.getProjects);
router.get("/user/:userId", projectController.getUserProjects);
router.delete("/:id", projectController.deleteProject);

router.get("/requests", projectController.getRequests);
router.post("/:id/join", projectController.requestJoin);
router.post("/:id/accept", projectController.acceptJoin);
router.post("/:id/reject", projectController.rejectJoin);

module.exports = router;
