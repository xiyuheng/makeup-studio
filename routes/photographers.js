const express = require('express');
const router = express.Router();
const Photographer = require('../models/Photographer');
const Portfolio = require('../models/Portfolio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 设置文件上传
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads');
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

// 摄影师列表页面
router.get('/', async (req, res) => {
    try {
        const photographers = await Photographer.find();
        res.render('photographers/index', { photographers });
    } catch (error) {
        console.error('获取摄影师列表错误:', error);
        req.flash('error', '获取摄影师列表失败');
        res.redirect('/');
    }
});

// 摄影师详情页面
router.get('/:id', async (req, res) => {
    try {
        const photographer = await Photographer.findById(req.params.id);
        if (!photographer) {
            req.flash('error', '未找到该摄影师');
            return res.redirect('/photographers');
        }
        
        const portfolios = await Portfolio.find({ photographer: req.params.id });
        res.render('photographers/show', { photographer, portfolios });
    } catch (error) {
        console.error('获取摄影师详情错误:', error);
        req.flash('error', '获取摄影师详情失败');
        res.redirect('/photographers');
    }
});

// 管理员 - 添加摄影师页面
router.get('/admin/add', isAdmin, (req, res) => {
    res.render('photographers/admin/add');
});

// 管理员 - 处理添加摄影师
router.post('/admin/add', isAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const { name, specialty, experience, description, email, phone } = req.body;
        
        // 检查必填字段
        if (!name || !specialty || !experience || !description || !req.file) {
            req.flash('error', '所有带*的字段都必须填写');
            return res.redirect('/photographers/admin/add');
        }
        
        const photographer = new Photographer({
            name,
            specialty,
            experience,
            description,
            avatar: `/uploads/${req.file.filename}`,
            contactInfo: {
                email,
                phone
            }
        });
        
        await photographer.save();
        req.flash('success', '摄影师添加成功');
        res.redirect('/photographers');
    } catch (error) {
        console.error('添加摄影师错误:', error);
        req.flash('error', '添加摄影师失败');
        res.redirect('/photographers/admin/add');
    }
});

// 管理员 - 编辑摄影师页面
router.get('/admin/edit/:id', isAdmin, async (req, res) => {
    try {
        const photographer = await Photographer.findById(req.params.id);
        if (!photographer) {
            req.flash('error', '未找到该摄影师');
            return res.redirect('/photographers');
        }
        res.render('photographers/admin/edit', { photographer });
    } catch (error) {
        console.error('获取编辑摄影师页面错误:', error);
        req.flash('error', '获取编辑页面失败');
        res.redirect('/photographers');
    }
});

// 管理员 - 处理编辑摄影师
router.post('/admin/edit/:id', isAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const { name, specialty, experience, description, email, phone, available } = req.body;
        
        // 检查必填字段
        if (!name || !specialty || !experience || !description) {
            req.flash('error', '所有带*的字段都必须填写');
            return res.redirect(`/photographers/admin/edit/${req.params.id}`);
        }
        
        const photographerUpdate = {
            name,
            specialty,
            experience,
            description,
            contactInfo: {
                email,
                phone
            },
            available: available === 'on'
        };
        
        // 如果上传了新头像
        if (req.file) {
            photographerUpdate.avatar = `/uploads/${req.file.filename}`;
        }
        
        await Photographer.findByIdAndUpdate(req.params.id, photographerUpdate);
        req.flash('success', '摄影师信息更新成功');
        res.redirect(`/photographers/${req.params.id}`);
    } catch (error) {
        console.error('更新摄影师错误:', error);
        req.flash('error', '更新摄影师失败');
        res.redirect(`/photographers/admin/edit/${req.params.id}`);
    }
});

// 管理员 - 删除摄影师
router.post('/admin/delete/:id', isAdmin, async (req, res) => {
    try {
        await Photographer.findByIdAndDelete(req.params.id);
        // 同时删除该摄影师的所有作品集
        await Portfolio.deleteMany({ photographer: req.params.id });
        req.flash('success', '摄影师已删除');
        res.redirect('/photographers');
    } catch (error) {
        console.error('删除摄影师错误:', error);
        req.flash('error', '删除摄影师失败');
        res.redirect('/photographers');
    }
});

// 管理员 - 添加作品集页面
router.get('/:photographerId/portfolio/add', isAdmin, async (req, res) => {
    try {
        const photographer = await Photographer.findById(req.params.photographerId);
        if (!photographer) {
            req.flash('error', '未找到该摄影师');
            return res.redirect('/photographers');
        }
        res.render('portfolio/add', { photographer });
    } catch (error) {
        console.error('获取添加作品集页面错误:', error);
        req.flash('error', '获取添加作品集页面失败');
        res.redirect('/photographers');
    }
});

// 管理员 - 处理添加作品集
router.post('/:photographerId/portfolio/add', isAdmin, upload.array('images', 10), async (req, res) => {
    try {
        const { title, description, category, makeupDetails, shootingLocation, shootingDate, featured } = req.body;
        
        // 检查必填字段
        if (!title || !description || !category || !req.files || req.files.length === 0) {
            req.flash('error', '所有带*的字段都必须填写，且至少上传一张图片');
            return res.redirect(`/photographers/${req.params.photographerId}/portfolio/add`);
        }
        
        // 处理上传的图片
        const images = req.files.map(file => {
            return {
                url: `/uploads/${file.filename}`,
                caption: ''
            };
        });
        
        const portfolio = new Portfolio({
            title,
            description,
            category,
            mainImage: images[0].url,
            images,
            photographer: req.params.photographerId,
            makeupDetails,
            shootingLocation,
            shootingDate: shootingDate || Date.now(),
            featured: featured === 'on'
        });
        
        await portfolio.save();
        req.flash('success', '作品集添加成功');
        res.redirect(`/photographers/${req.params.photographerId}`);
    } catch (error) {
        console.error('添加作品集错误:', error);
        req.flash('error', '添加作品集失败');
        res.redirect(`/photographers/${req.params.photographerId}/portfolio/add`);
    }
});

module.exports = router; 