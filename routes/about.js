const express = require('express');
const router = express.Router();
const Photographer = require('../models/Photographer');

// 关于我们页面
router.get('/', async (req, res) => {
    try {
        // 获取摄影师团队成员
        const photographers = await Photographer.find().limit(6);
        
        res.render('about/index', { photographers });
    } catch (error) {
        console.error('获取关于我们页面错误:', error);
        req.flash('error', '获取页面失败');
        res.redirect('/');
    }
});

module.exports = router; 