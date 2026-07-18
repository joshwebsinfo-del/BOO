const express = require('express');
const router = express.Router();
const multer = require('multer');
const resourcesController = require('../controllers/resourcesController');
const { verifyToken, requireRole } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, requireRole(['Admin']), upload.single('file'), resourcesController.uploadResource);
router.get('/', verifyToken, resourcesController.listResources);
router.get('/:id', verifyToken, resourcesController.getResource);
router.get('/:id/download', verifyToken, resourcesController.downloadResource);
router.delete('/:id', verifyToken, requireRole(['Admin']), resourcesController.deleteResource);

module.exports = router;
