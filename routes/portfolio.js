const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Photographer = require('../models/Photographer');

// 作品集列表页面
router.get('/', async (req, res) => {
    try {
        const { category, photographer } = req.query;
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        if (photographer) {
            query.photographer = photographer;
        }
        
        const portfolios = await Portfolio.find(query).populate('photographer');
        const categories = ['个人写真', '婚纱照', '商业摄影', '艺术摄影', '其他'];
        const photographers = await Photographer.find();
        
        res.render('portfolio/index', { 
            portfolios, 
            categories, 
            photographers,
            currentCategory: category || '所有',
            currentPhotographer: photographer || '所有'
        });
    } catch (error) {
        console.error('获取作品集列表错误:', error);
        req.flash('error', '获取作品集列表失败');
        res.redirect('/');
    }
});

// 作品集详情页面
router.get('/:id', async (req, res) => {
    try {
        const portfolio = await Portfolio.findById(req.params.id).populate('photographer');
        if (!portfolio) {
            req.flash('error', '未找到该作品集');
            return res.redirect('/portfolio');
        }
        
        // 获取相同类别的其他作品集推荐
        const relatedPortfolios = await Portfolio.find({
            category: portfolio.category,
            _id: { $ne: portfolio._id }
        }).limit(3).populate('photographer');
        
        res.render('portfolio/show', { portfolio, relatedPortfolios });
    } catch (error) {
        console.error('获取作品集详情错误:', error);
        req.flash('error', '获取作品集详情失败');
        res.redirect('/portfolio');
    }
});

module.exports = router; 