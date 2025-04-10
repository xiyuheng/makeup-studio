// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 导航栏滚动效果
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // 向下滚动
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // 向上滚动
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });

    // 移动端菜单切换
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    document.querySelector('nav').prepend(menuToggle);

    menuToggle.addEventListener('click', () => {
        const nav = document.querySelector('nav ul');
        nav.classList.toggle('active');
    });

    // 服务卡片数据
    const services = [
        {
            title: '新娘妆造',
            description: '专业新娘妆造服务，打造完美婚礼造型',
            image: '/images/service1.jpg'
        },
        {
            title: '个人写真',
            description: '专业摄影团队，记录你的精彩瞬间',
            image: '/images/service2.jpg'
        },
        {
            title: '商业摄影',
            description: '专业商业摄影服务，提升品牌形象',
            image: '/images/service3.jpg'
        }
    ];

    // 动态加载服务卡片
    const serviceCards = document.querySelector('.service-cards');
    if (serviceCards) {
        services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <img src="${service.image}" alt="${service.title}">
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <a href="/services" class="learn-more">了解更多</a>
            `;
            serviceCards.appendChild(card);
        });
    }
}); 