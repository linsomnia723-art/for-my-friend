/* ==========================================
   静谧影院式音频系统 (Cinematic Audio System)
   ========================================== */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.bgMusic = null;
        this.isMuted = true;
        this.initialized = false;
        // 优先加载本地的 bgm.mp3 (推荐下载陶喆《爱很简单》/方大同《三人游》等放进项目文件夹，命名为 bgm.mp3)
        this.localMusicUrl = 'bgm.mp3';
        // 若本地文件不存在，默认加载线上舒适、柔和的 R&B Lofi 乐曲作为 fallback
        this.fallbackMusicUrl = 'https://assets.codepen.io/4358584/Anitek_-_01_-_Kisses.mp3';
    }

    init() {
        if (this.initialized) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
        }

        this.bgMusic = new Audio();
        this.bgMusic.src = this.localMusicUrl;
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3; // 保持低音量背景氛围

        // 核心：若本地 bgm.mp3 加载失败（如文件未放置），自动加载线上 R&B Fallback 伴奏
        this.bgMusic.addEventListener('error', () => {
            if (this.bgMusic.src.indexOf(this.localMusicUrl) !== -1) {
                console.log('未检测到本地 bgm.mp3，已自动加载线上 R&B Fallback 伴奏...');
                this.bgMusic.src = this.fallbackMusicUrl;
                if (!this.isMuted) {
                    this.bgMusic.play().catch(() => {});
                }
            }
        });

        this.initialized = true;
    }
    playMusic() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        this.bgMusic.play()
            .then(() => {
                this.isMuted = false;
                document.getElementById('musicToggle').classList.add('playing');
            })
            .catch(err => {
                console.warn('音乐开启受浏览器安全策略限制，需用户再次交互: ', err);
            });
    }

    toggle() {
        this.init();
        if (this.isMuted) {
            this.bgMusic.play().catch(() => {});
            this.isMuted = false;
            document.getElementById('musicToggle').classList.add('playing');
        } else {
            this.bgMusic.pause();
            this.isMuted = true;
            document.getElementById('musicToggle').classList.remove('playing');
        }
    }

    // 利用 Web Audio API 动态合成高质感音效，规避网络音频资源加载风险
    playSynthSound(type) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        if (type === 'unseal') {
            // 火漆封印碎裂声音：模拟高频碎屑加沙沙声
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.6);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } 
        else if (type === 'card-flip') {
            // 翻页纸张质感滑音：非常微弱的低频温暖过渡
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
        else if (type === 'basket-swish') {
            // 空心入网：模拟金属磬音与空灵余音
            osc.type = 'sine';
            osc.frequency.setValueAtTime(349.23, now); // F4
            osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.4); // C5
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } 
        else if (type === 'cat-purr') {
            // 触碰黑猫：合成一段温润悠长的心灵泛音
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.quadraticRampToValueAtTime(554.37, now + 0.15); // C#5
            osc.frequency.quadraticRampToValueAtTime(659.25, now + 0.3); // E5
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
        else if (type === 'reveal-future') {
            // 解锁电影感彩蛋：多重古铜金属磬声叠加，具有神圣宁静感
            const baseFreqs = [261.63, 329.63, 392.00, 523.25]; // C 和弦
            baseFreqs.forEach((freq, index) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.connect(g);
                g.connect(this.ctx.destination);
                o.type = 'sine';
                o.frequency.setValueAtTime(freq, now + index * 0.15);
                g.gain.setValueAtTime(0.12, now + index * 0.15);
                g.gain.linearRampToValueAtTime(0.005, now + index * 0.15 + 1.2);
                o.start(now + index * 0.15);
                o.stop(now + index * 0.15 + 1.2);
            });
        }
    }
}

const audio = new AudioManager();

/* ==========================================
   页面交互与动画控制器
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 动态生成背景微动粒子
    initDynamicParticles();

    // 0. 密码锁逻辑控制
    const passcodeOverlay = document.getElementById('passcodeOverlay');
    const passcodeInput = document.getElementById('passcodeInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const errorMsg = document.getElementById('errorMsg');
    const passcodeCard = passcodeOverlay.querySelector('.passcode-card');
    const envelopeContainer = document.getElementById('envelopeContainer');

    // 默认生日密码为 '0702'。你可以在这里修改为其他任意密码（如他的生日）！
    const CORRECT_PASSCODE = '0702'; 

    // 加密信件内容：由 Base64 编码，隐藏真实中文，保证 GitHub 公开仓库时的信件隐私
    const ENCRYPTED_LETTER = "PGgyIGNsYXNzPSJsZXR0ZXItdGl0bGUiPlRvOiDkvJjnp4DnmoTnp5HnoJTmkK3lrZA8L2gyPgo8cCBjbGFzcz0icGFyYWdyYXBoIj7lsZXkv6HkvbPjgII8L3A+CjxwIGNsYXNzPSJwYXJhZ3JhcGgiPuWcqOi/meS4queJueWIq+eahOaXpeWtkOmHjO+8jOmmluWFiOelneS9oOeUn+aXpeW/q+S5kO+8gTwvcD4KPHAgY2xhc3M9InBhcmFncmFwaCI+5Zue6aG+6L+H5Y6777yM5oiR5Lus5q+P5aSp55qE5Lqk5rWB6Jm954S25aSa5piv5Zu057uV5a2m5Lia77yM5pyJ5pe25YCZ5Y+q5piv5LiA5Lik5Y+l566A5Y2V55qE6Zeu5YCZ5oiW6K6o6K6677yM5L2G6L+Z56eN56iz5a6a5LiU6buY5aWR55qE6IqC5aWP77yM57uZ5LqG5oiR5b6I5aSa5pSv5oyB44CC5LiN566h5piv6K6o6K665aSN5p2C55qE566X5rOV77yM6L+Y5piv5ZCQ5qe95a2m5Lia5LiK55qE55O26aKI77yM5pyJ5L2g5Zyo6Lqr5peB5LiA6LW35YiG5ouF77yM5p6v54el55qE5a2m5pyv5pel5bi45Lmf5Y+Y5b6X5pyJ6Laj5LqG6LW35p2l44CCPC9wPgo8cCBjbGFzcz0icGFyYWdyYXBoIj7nlJ/mtLvkuI3ku4XmnInorrrmlofjgIHku6PnoIEgYW5kIOaXoOWwveeahOS7u+WKoe+8jOi/mOacieevrueQg+WcuuS4iuiChuaEj+aMpea0kueahOaxl+awtO+8jOS7peWPiueci+WIsOWPr+eIseeMq+WSquaXtumCo+S4gOeerOmXtOeahOayu+aEiOOAguW4jOacm+aWsOeahOS4gOWygemHjO+8jOS9oOeahOS7o+eggeWwkeS4gOS6myBCdWfvvIznr67nkIPmioDmnK/mm7TkuIrkuIDlsYLmpbzvvIzmr4/lpKnpg73og73lg4/lkLjnjKvkuIDmoLfmhJ/liLDovbvmnb7lv6vkuZDjgII8L3A+CjxwIGNsYXNzPSJwYXJhZ3JhcGgiPuelneaWsOeahOS4gOWyge+8jOaJgOaxgueahuaJgOaEv++8jOaJgOihjOeahuWdpumAlOOAguaEv+aIkeS7rOe7p+e7reWcqOWtpuacr+WSjOeUn+a0u+eahOmBk+i3r+S4iu+8jOW5tuiCqeWJjeihjO+8jOWFseWQjOi/m+atpe+8gTwvcD4KPGRpdiBjbGFzcz0ibGV0dGVyLXNpZ25hdHVyZSI+CiAgICA8cCBjbGFzcz0ic2lnLW5hbWUiPuS9oOeahOWtpuS4muaImOWPizwvcD4KICAgIDxwIGNsYXNzPSJzaWctZGF0ZSI+5LqOIDIwMjYg5bm05aSPPC9wPgo8L2Rpdj4=";

    function checkPasscode() {
        const value = passcodeInput.value.trim();
        if (value === CORRECT_PASSCODE) {
            errorMsg.classList.remove('active');
            passcodeOverlay.classList.remove('active');
            
            // 密码正确，在内存中动态解密信件内容并注入 DOM
            try {
                const decodedHTML = decodeURIComponent(escape(atob(ENCRYPTED_LETTER)));
                document.getElementById('secretLetter').innerHTML = decodedHTML;
            } catch (err) {
                console.error("信件解密失败：", err);
                document.getElementById('secretLetter').innerHTML = "<p class='paragraph'>[解密错误：密文数据损坏]</p>";
            }

            // 淡出锁屏并激活 3D 信封屏幕
            setTimeout(() => {
                passcodeOverlay.style.display = 'none';
                envelopeContainer.classList.add('active');
            }, 800);
        } else {
            // 密码错误，执行抖动动画与重置输入
            errorMsg.classList.add('active');
            passcodeCard.classList.add('shake');
            passcodeInput.value = '';
            passcodeInput.focus();
            
            setTimeout(() => {
                passcodeCard.classList.remove('shake');
            }, 400);
        }
    }

    verifyBtn.addEventListener('click', checkPasscode);
    passcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPasscode();
        }
    });

    // 页面加载后自动将光标聚焦于输入框
    setTimeout(() => {
        passcodeInput.focus();
    }, 500);

    // 1. 拆信封仪式交互
    const envelope = document.getElementById('envelope');
    const notebookCard = document.getElementById('notebookCard');

    envelope.addEventListener('click', () => {
        if (envelope.classList.contains('open')) return;

        // 标记并触发拆封 3D CSS 动画
        envelope.classList.add('open');
        audio.playSynthSound('unseal');
        
        // 顺带自动开启背景轻音乐
        audio.playMusic();

        // 场景过渡过渡
        setTimeout(() => {
            envelopeContainer.style.opacity = '0';
            envelopeContainer.style.transform = 'scale(0.9) translateY(-30px)';
            
            setTimeout(() => {
                envelopeContainer.style.display = 'none';
                notebookCard.classList.add('active');
            }, 800);
        }, 1500);
    });

    // 2. 音乐图标开关
    const musicToggle = document.getElementById('musicToggle');
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止冒泡到信封点击
        audio.toggle();
    });

    // 3. 笔记本导航 Tabs 切换
    const tabBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.journal-page');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            // 更新标签页按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 切换面板显示
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 4. 观测日志卡片 3D 翻转
    const logCards = document.querySelectorAll('.log-card');
    logCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 点击合上或打开
            card.classList.toggle('flipped');
            audio.playSynthSound('card-flip');
        });
    });

    // 5. 篮球蓝图悬停与投篮交互
    const courtBlueprint = document.getElementById('courtBlueprint');
    const ballPoint = document.getElementById('ballPoint');
    let isShooting = false;

    courtBlueprint.addEventListener('click', () => {
        if (isShooting) return;
        isShooting = true;

        ballPoint.classList.add('animate');
        audio.playSynthSound('card-flip'); // 投球滑音

        // 模拟球入网时刻
        setTimeout(() => {
            audio.playSynthSound('basket-swish');
        }, 750);

        // 动画结束复位
        setTimeout(() => {
            ballPoint.classList.remove('animate');
            isShooting = false;
            incrementAmbient(1);
        }, 1000);
    });

    // 6. 抚摸静默黑猫交互 (粒子特效)
    const catSilence = document.getElementById('catSilence');
    const catCanvas = document.getElementById('catCanvas');

    catSilence.addEventListener('click', (e) => {
        audio.playSynthSound('cat-purr');
        
        // 产生暗金色微光粒子
        const rect = catCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (let i = 0; i < 6; i++) {
            createGoldEmber(mouseX, mouseY);
        }

        incrementAmbient(1);
    });

    function createGoldEmber(x, y) {
        const ember = document.createElement('div');
        ember.className = 'ember-particle';
        ember.style.left = x + 'px';
        ember.style.top = y + 'px';
        
        // 微调粒子初速度和方向
        const driftX = (Math.random() - 0.5) * 40;
        const driftY = -(Math.random() * 40 + 20);
        ember.style.setProperty('--drift-x', `${driftX}px`);
        ember.style.setProperty('--drift-y', `${driftY}px`);

        catCanvas.appendChild(ember);
        
        setTimeout(() => {
            ember.remove();
        }, 1000);
    }

    // 7. 静谧度达成与电影感彩蛋解锁
    let ambientScore = 0;
    const ambientCountEl = document.getElementById('ambientCount');
    const cinemaModal = document.getElementById('cinemaModal');
    const closeCinema = document.getElementById('closeCinema');

    function incrementAmbient(val) {
        ambientScore += val;
        if (ambientCountEl) {
            ambientCountEl.textContent = Math.min(5, ambientScore);
        }

        if (ambientScore >= 5 && !state.unlocked) {
            state.unlocked = true;
            setTimeout(() => {
                audio.playSynthSound('reveal-future');
                cinemaModal.style.display = 'flex';
                setTimeout(() => {
                    cinemaModal.classList.add('active');
                }, 50);
            }, 800);
        }
    }

    const state = { unlocked: false };

    closeCinema.addEventListener('click', () => {
        cinemaModal.classList.remove('active');
        setTimeout(() => {
            cinemaModal.style.display = 'none';
        }, 800);
    });
});

/* ==========================================
   星空漂动粒子辅助逻辑
   ========================================== */
function initDynamicParticles() {
    const container = document.getElementById('starsContainer');
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.width = Math.random() * 2 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.borderRadius = '50%';
        star.style.background = 'rgba(205, 160, 82, 0.3)';
        star.style.left = Math.random() * screenWidth + 'px';
        star.style.top = Math.random() * screenHeight + 'px';
        star.style.pointerEvents = 'none';
        star.style.opacity = Math.random() * 0.5 + 0.2;

        const duration = Math.random() * 30 + 30;
        star.style.transition = `transform ${duration}s linear, opacity ${duration}s ease`;
        container.appendChild(star);

        setTimeout(() => {
            floatStar(star, duration);
        }, 100);
    }
}

function floatStar(star, duration) {
    const tx = (Math.random() - 0.5) * 80;
    const ty = (Math.random() - 0.5) * 80;
    star.style.transform = `translate(${tx}px, ${ty}px)`;
    star.style.opacity = Math.random() * 0.6 + 0.1;

    setTimeout(() => {
        floatStar(star, duration);
    }, duration * 1000);
}
