// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { updateProfil, changePassword } = require('../controllers/userController');
router.put('/profil', updateProfil);
router.put('/profil/password', changePassword);
module.exports = router;