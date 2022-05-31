const express = require('express');

const router = express.Router();

const DUMMY_USERS = [{
    id: 'u1',
    name: 'Tim',
    password: 'dimex2k7',
    gender: 'male'
}];

router.get('/:uid', (req, res, next) => {
    const userId = req.params.uid;
    const user = DUMMY_USERS.find(u => {
        return u.id === userId;
    });
    res.json({ user });
});

module.exports = router;