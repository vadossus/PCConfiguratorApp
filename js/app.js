class PCConfiguratorApp {
    constructor() {
        this.dataManager = null;
        this.authManager = null;
        this.modalManager = null;
        this.configurator = null;
        this.init();
    }

    async init() {
        try {
            this.showSplashScreen();
            
            this.dataManager = new DataManager();
            this.authManager = new AuthManager();
            
            await this.preloadData();
            
            this.configurator = new Configurator(this.dataManager, this.authManager);
            this.modalManager = new ModalManager(this.dataManager, this.configurator);
            
            window.modalManager = this.modalManager;
            window.configurator = this.configurator;
                    
            this.configurator.renderComponentCards();
            this.configurator.updateCompatibilityStatus();
            
            this.hideSplashScreen();
            this.bindGlobalEvents();
            this.initHeroAnimations(); 
            
        } catch (error) {
            this.showError('Не удалось загрузить приложение');
        }
    }

    async preloadData() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    initHeroAnimations() {
        setTimeout(() => {
            const heroImages = document.querySelectorAll('.image-container');
            heroImages.forEach((img, index) => {
                setTimeout(() => {
                    img.classList.add('visible');
                }, index * 100);
            });
        }, 1000);
        
        this.initParallaxEffect();
    }

    initParallaxEffect() {
        const heroImages = document.querySelectorAll('.image-container');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroSection = document.querySelector('.hero-section');
            const heroRect = heroSection.getBoundingClientRect();
            
            if (heroRect.top < window.innerHeight && heroRect.bottom > 0) {
                const scrollPercentage = Math.max(0, Math.min(1, 1 - (heroRect.top / window.innerHeight)));
                
                heroImages.forEach((img, index) => {
                    const speed = index === 0 ? 0.1 : 0.05;
                    const translateY = scrolled * speed;
                
                    img.style.transform = `translateY(${translateY}px) scale(${1 - scrollPercentage * 0.1})`;
                });
            }
        });
    }

    showSplashScreen() {
        const splash = document.createElement('div');
        splash.id = 'splash-screen';
        splash.innerHTML = `
            <div class="splash-content">
                <div class="splash-spinner"></div>
                <h2>PC Configurator</h2>
                <p>Загрузка конфигуратора...</p>
            </div>
        `;
        
        splash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #000000ff 0%, #585858ff 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        document.body.appendChild(splash);
    }

    hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (splash.parentElement) {
                    splash.parentElement.removeChild(splash);
                }
            }, 500);
        }
    }

    bindGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modalManager.hideComponentModal();
                this.authManager.hideAuthModal();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.configurator.saveBuildToStorage();
        });
        
        window.addEventListener('scroll', () => {
            const scrollTop = document.querySelector('.scroll-top');
            if (window.scrollY > 300) {
                scrollTop.classList.add('visible');
            } else {
                scrollTop.classList.remove('visible');
            }
        });
        
        document.querySelector('.scroll-top')?.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    showError(message) {
        alert(`Ошибка: ${message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PCConfiguratorApp();
});

function scrollToConfigurator() {
    const configuratorSection = document.getElementById('configurator');
    if (configuratorSection) {
        configuratorSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = "admin.html"
        });
    }
});

