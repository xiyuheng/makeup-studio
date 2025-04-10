const express = require('express');
const router = express.Router();
const Photographer = require('../models/Photographer');
const Portfolio = require('../models/Portfolio');
const Service = require('../models/Service');
const Carousel = require('../models/Carousel');

// 获取摄影师列表API
router.get('/photographers', async (req, res) => {
    try {
        const photographers = await Photographer.find();
        res.json(photographers);
    } catch (error) {
        console.error('获取摄影师API错误:', error);
        res.status(500).json({ message: '获取摄影师数据失败' });
    }
});

// 获取单个摄影师API
router.get('/photographers/:id', async (req, res) => {
    try {
        const photographer = await Photographer.findById(req.params.id);
        if (!photographer) {
            return res.status(404).json({ message: '未找到摄影师' });
        }
        res.json(photographer);
    } catch (error) {
        console.error('获取摄影师详情API错误:', error);
        res.status(500).json({ message: '获取摄影师详情失败' });
    }
});

// 获取摄影师作品集API
router.get('/photographers/:id/portfolios', async (req, res) => {
    try {
        const portfolios = await Portfolio.find({ photographer: req.params.id });
        res.json(portfolios);
    } catch (error) {
        console.error('获取摄影师作品集API错误:', error);
        res.status(500).json({ message: '获取摄影师作品集失败' });
    }
});

// 获取服务列表API
router.get('/services', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        const services = await Service.find(query);
        res.json(services);
    } catch (error) {
        console.error('获取服务API错误:', error);
        res.status(500).json({ message: '获取服务数据失败' });
    }
});

// 获取单个服务API
router.get('/services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: '未找到服务' });
        }
        res.json(service);
    } catch (error) {
        console.error('获取服务详情API错误:', error);
        res.status(500).json({ message: '获取服务详情失败' });
    }
});

// 获取作品集列表API
router.get('/portfolios', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        const portfolios = await Portfolio.find(query).populate('photographer', 'name');
        res.json(portfolios);
    } catch (error) {
        console.error('获取作品集API错误:', error);
        res.status(500).json({ message: '获取作品集数据失败' });
    }
});

// 获取单个作品集API
router.get('/portfolios/:id', async (req, res) => {
    try {
        const portfolio = await Portfolio.findById(req.params.id).populate('photographer');
        if (!portfolio) {
            return res.status(404).json({ message: '未找到作品集' });
        }
        res.json(portfolio);
    } catch (error) {
        console.error('获取作品集详情API错误:', error);
        res.status(500).json({ message: '获取作品集详情失败' });
    }
});

// 获取轮播图API
router.get('/carousel', async (req, res) => {
    try {
        const { type } = req.query;
        let query = { active: true };
        
        if (type) {
            query.type = type;
        }
        
        const carousels = await Carousel.find(query).sort('order');
        res.json(carousels);
    } catch (error) {
        console.error('获取轮播图API错误:', error);
        res.status(500).json({ message: '获取轮播图数据失败' });
    }
});

module.exports = router; 