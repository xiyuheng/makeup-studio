const express = require('express');
const router = express.Router();
const Carousel = require('../models/Carousel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 设置文件上传
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads/carousel');
        // 确保上传目录存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
    fileFilter: function(req, file, cb) {
        // 只接受图片文件
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('只允许上传图片文件!'), false);
        }
        cb(null, true);
    }
});

// 检查管理员权限
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    req.flash('error', '需要管理员权限');
    res.redirect('/auth/login');
};

// 管理员仪表板
router.get('/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard');
});

// =============== 轮播图管理 ===============

// 轮播图列表页面
router.get('/carousel', isAdmin, async (req, res) => {
    try {
        const type = req.query.type || 'home';
        const carousels = await Carousel.find({ type }).sort('order');
        res.render('admin/carousel/index', { carousels, currentType: type });
    } catch (error) {
        console.error('获取轮播图列表错误:', error);
        req.flash('error', '获取轮播图列表失败');
        res.redirect('/admin/dashboard');
    }
});

// 添加轮播图页面
router.get('/carousel/add', isAdmin, (req, res) => {
    const type = req.query.type || 'home';
    res.render('admin/carousel/add', { type });
});

// 处理添加轮播图
router.post('/carousel/add', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, link, type, order, active } = req.body;
        
        // 检查必填字段
        if (!title || !req.file) {
            req.flash('error', '标题和图片必须提供');
            return res.redirect(`/admin/carousel/add?type=${type || 'home'}`);
        }
        
        const carousel = new Carousel({
            title,
            description,
            link,
            type: type || 'home',
            order: order || 0,
            active: active === 'on',
            image: `/uploads/carousel/${req.file.filename}`
        });
        
        await carousel.save();
        req.flash('success', '轮播图添加成功');
        res.redirect(`/admin/carousel?type=${type || 'home'}`);
    } catch (error) {
        console.error('添加轮播图错误:', error);
        req.flash('error', '添加轮播图失败');
        res.redirect('/admin/carousel/add');
    }
});

// 编辑轮播图页面
router.get('/carousel/edit/:id', isAdmin, async (req, res) => {
    try {
        const carousel = await Carousel.findById(req.params.id);
        if (!carousel) {
            req.flash('error', '未找到该轮播图');
            return res.redirect('/admin/carousel');
        }
        res.render('admin/carousel/edit', { carousel });
    } catch (error) {
        console.error('获取编辑轮播图页面错误:', error);
        req.flash('error', '获取编辑页面失败');
        res.redirect('/admin/carousel');
    }
});

// 处理编辑轮播图
router.post('/carousel/edit/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, link, type, order, active } = req.body;
        
        // 检查必填字段
        if (!title) {
            req.flash('error', '标题必须提供');
            return res.redirect(`/admin/carousel/edit/${req.params.id}`);
        }
        
        const carouselUpdate = {
            title,
            description,
            link,
            type: type || 'home',
            order: order || 0,
            active: active === 'on'
        };
        
        // 如果上传了新图片
        if (req.file) {
            carouselUpdate.image = `/uploads/carousel/${req.file.filename}`;
        }
        
        await Carousel.findByIdAndUpdate(req.params.id, carouselUpdate);
        req.flash('success', '轮播图更新成功');
        res.redirect(`/admin/carousel?type=${type || 'home'}`);
    } catch (error) {
        console.error('更新轮播图错误:', error);
        req.flash('error', '更新轮播图失败');
        res.redirect(`/admin/carousel/edit/${req.params.id}`);
    }
});

// 删除轮播图
router.post('/carousel/delete/:id', isAdmin, async (req, res) => {
    try {
        const carousel = await Carousel.findById(req.params.id);
        const type = carousel.type;
        await Carousel.findByIdAndDelete(req.params.id);
        req.flash('success', '轮播图已删除');
        res.redirect(`/admin/carousel?type=${type}`);
    } catch (error) {
        console.error('删除轮播图错误:', error);
        req.flash('error', '删除轮播图失败');
        res.redirect('/admin/carousel');
    }
});

module.exports = router; 