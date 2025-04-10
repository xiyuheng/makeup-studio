const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();

// 连接MongoDB - 支持Glitch环境
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/makeup-studio';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB连接成功');
}).catch(err => {
    console.error('MongoDB连接失败:', err.message);
});

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// 全局变量
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.messages = req.flash();
    next();
});

// Passport配置
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { message: '用户名或密码错误' });
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return done(null, false, { message: '用户名或密码错误' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// 路由
app.use('/auth', require('./routes/auth'));
app.use('/photographers', require('./routes/photographers'));
app.use('/services', require('./routes/services'));
app.use('/portfolio', require('./routes/portfolio'));
app.use('/about', require('./routes/about'));
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

// 首页路由
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// 创建管理员账户函数
const createAdminUser = async () => {
    try {
        // 检查是否已存在管理员
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return console.log('管理员账户已存在');
        }
        
        // 创建管理员账户
        const admin = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123', // 实际应用中应使用更安全的密码
            role: 'admin'
        });
        
        await admin.save();
        console.log('管理员账户创建成功');
    } catch (error) {
        console.error('创建管理员账户失败:', error);
    }
};

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    // 创建默认管理员账户
    createAdminUser();
}); 