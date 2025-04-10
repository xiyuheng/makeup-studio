const express = require('express');
const router = express.Router();
const User = require('../models/User');
const passport = require('passport');

// 注册页面
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// 处理注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            req.flash('error', '用户名或邮箱已被使用');
            return res.redirect('/auth/register');
        }

        // 创建新用户
        const user = new User({ username, email, password });
        await user.save();

        // 自动登录
        req.login(user, (err) => {
            if (err) {
                req.flash('error', '登录失败');
                return res.redirect('/auth/login');
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('注册错误:', error);
        req.flash('error', '注册过程中发生错误');
        res.redirect('/auth/register');
    }
});

// 登录页面
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// 处理登录
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

// 登出 - 适配Passport v0.6.0
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = router; 