const express = require('express');
const router = express.Router();

router.post('/logout', (req, res) => {
  // With JWT, logout is handled on the client side by deleting the token.
  // But you can still respond to the client with a message.
  return res.status(200).json({ message: 'Logout successful. Please delete the token on the client.' });
});

module.exports = router;
