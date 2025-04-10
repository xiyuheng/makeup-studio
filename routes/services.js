const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
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

// 服务列表页面
router.get('/', async (req, res) => {
    try {
        const category = req.query.category || '所有';
        let query = {};
        
        if (category !== '所有') {
            query.category = category;
        }
        
        const services = await Service.find(query);
        const categories = ['所有', '妆造服务', '摄影服务', '套餐服务'];
        
        res.render('services/index', { services, categories, currentCategory: category });
    } catch (error) {
        console.error('获取服务列表错误:', error);
        req.flash('error', '获取服务列表失败');
        res.redirect('/');
    }
});

// 服务详情页面
router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            req.flash('error', '未找到该服务');
            return res.redirect('/services');
        }
        
        // 获取相同类别的其他服务推荐
        const recommendedServices = await Service.find({
            category: service.category,
            _id: { $ne: service._id }
        }).limit(3);
        
        res.render('services/show', { service, recommendedServices });
    } catch (error) {
        console.error('获取服务详情错误:', error);
        req.flash('error', '获取服务详情失败');
        res.redirect('/services');
    }
});

// 管理员 - 添加服务页面
router.get('/admin/add', isAdmin, (req, res) => {
    res.render('services/admin/add');
});

// 管理员 - 处理添加服务
router.post('/admin/add', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, subcategory, price, duration, features, isPopular } = req.body;
        
        // 检查必填字段
        if (!name || !description || !category || !subcategory || !price || !duration || !req.file) {
            req.flash('error', '所有带*的字段都必须填写');
            return res.redirect('/services/admin/add');
        }
        
        // 处理特点列表
        const featureList = features ? features.split('\n').filter(f => f.trim() !== '') : [];
        
        const service = new Service({
            name,
            description,
            category,
            subcategory,
            price,
            duration,
            image: `/uploads/${req.file.filename}`,
            features: featureList,
            isPopular: isPopular === 'on'
        });
        
        await service.save();
        req.flash('success', '服务添加成功');
        res.redirect('/services');
    } catch (error) {
        console.error('添加服务错误:', error);
        req.flash('error', '添加服务失败');
        res.redirect('/services/admin/add');
    }
});

// 管理员 - 编辑服务页面
router.get('/admin/edit/:id', isAdmin, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            req.flash('error', '未找到该服务');
            return res.redirect('/services');
        }
        res.render('services/admin/edit', { service });
    } catch (error) {
        console.error('获取编辑服务页面错误:', error);
        req.flash('error', '获取编辑页面失败');
        res.redirect('/services');
    }
});

// 管理员 - 处理编辑服务
router.post('/admin/edit/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, subcategory, price, duration, features, isPopular } = req.body;
        
        // 检查必填字段
        if (!name || !description || !category || !subcategory || !price || !duration) {
            req.flash('error', '所有带*的字段都必须填写');
            return res.redirect(`/services/admin/edit/${req.params.id}`);
        }
        
        // 处理特点列表
        const featureList = features ? features.split('\n').filter(f => f.trim() !== '') : [];
        
        const serviceUpdate = {
            name,
            description,
            category,
            subcategory,
            price,
            duration,
            features: featureList,
            isPopular: isPopular === 'on'
        };
        
        // 如果上传了新图片
        if (req.file) {
            serviceUpdate.image = `/uploads/${req.file.filename}`;
        }
        
        await Service.findByIdAndUpdate(req.params.id, serviceUpdate);
        req.flash('success', '服务信息更新成功');
        res.redirect(`/services/${req.params.id}`);
    } catch (error) {
        console.error('更新服务错误:', error);
        req.flash('error', '更新服务失败');
        res.redirect(`/services/admin/edit/${req.params.id}`);
    }
});

// 管理员 - 删除服务
router.post('/admin/delete/:id', isAdmin, async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        req.flash('success', '服务已删除');
        res.redirect('/services');
    } catch (error) {
        console.error('删除服务错误:', error);
        req.flash('error', '删除服务失败');
        res.redirect('/services');
    }
});

module.exports = router; 