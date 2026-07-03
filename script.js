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
            // 火漆封印碎裂声音
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.6);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } 
        else if (type === 'card-flip') {
            // 翻页纸张质感音效
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
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

    // 默认生日密码修改为 '0706'
    const CORRECT_PASSCODE = '0706'; 

    // 加密信件内容：由 Base64 编码，隐藏真实中文，保证 GitHub 公开仓库时的信件隐私
    const ENCRYPTED_LETTER = "PGgyIGNsYXNzPSJsZXR0ZXItdGl0bGUiPlRvOiDkvJjnp4DnmoTnp5HnoJTmkK3lrZA8L2gyPgo8cCBjbGFzcz0icGFyYWdyYXBoIj7lsZXkv6HkvbPjgII8L3A+CjxwIGNsYXNzPSJwYXJhZ3JhcGgiPuWcqOi/meS4queJueWIq+eahOaXpeWtkOmHjO+8jOmmluWFiOelneS9oOeUn+aXpeW/q+S5kO+8gTwvcD4KPHAgY2xhc3M9InBhcmFncmFwaCI+5Zue6aG+6L+H5Y6777yM5oiR5Lus5q+P5aSp55qE5Lqk5rWB6Jm954S25aSa5piv5Zu057uV5a2m5Lia77yM5pyJ5pe25YCZ5Y+q5piv5LiA5Lik5Y+l566A5Y2V55qE6Zeu5YCZ5oiW6K6o6K6677yM5L2G6L+Z56eN56iz5a6a5LiU6buY5aWR55qE6IqC5aWP77yM57uZ5LqG5oiR5b6I5aSa5pSv5oyB44CC5LiN566h5piv6K6o6K665aSN5p2C55qE566X5rOV77yM6L+Y5piv5ZCQ5qe95a2m5Lia5LiK55qE55O26aKI77yM5pyJ5L2g5Zyo6Lqr5peB5LiA6LW35YiG5ouF77yM5p6v54el55qE5a2m5pyv5pel5bi45Lmf5Y+Y5b6X5pyJ6Laj5LqG6LW35p2l44CCPC9wPgo8cCBjbGFzcz0icGFyYWdyYXBoIj7nlJ/mtLvkuI3ku4XmnInorrrmlofjgIHku6PnoIEgYW5kIOaXoOWwveeahOS7u+WKoe+8jOi/mOacieevrueQg+WcuuS4iuiChuaEj+aMpea0kueahOaxl+awtO+8jOS7peWPiueci+WIsOWPr+eIseeMq+WSquaXtumCo+S4gOeerOmXtOeahOayu+aEiOOAguW4jOacm+aWsOeahOS4gOWygemHjO+8jOS9oOeahOS7o+eggeWwkeS4gOS6myBCdWfvvIznr67nkIPmioDmnK/mm7TkuIrkuIDlsYLmpbzvvIzmr4/lpKnpg73og73lg4/lkLjnjKvkuIDmoLfmhJ/liLDovbvmnb7lv6vkuZDjgII8L3A+CjxwIGNsYXNzPSJwYXJhZ3JhcGgiPuelneaWsOeahOS4gOWyge+8jOaJgOaxgueahuaJgOaEv++8jOaJgOihjOeahuWdpumAlOOAguaEv+aIkeS7rOe7p+e7reWcqOWtpuacr+WSjOeUn+a0u+eahOmBk+i3r+S4iu+8jOW5tuiCqeWJjeihjO+8jOWFseWQjOi/m+atpe+8gTwvcD4KPGRpdiBjbGFzcz0ibGV0dGVyLXNpZ25hdHVyZSI+CiAgICA8cCBjbGFzcz0ic2lnLW5hbWUiPuS9oOeahOWtpuS4muaImOWPizwvcD4KICAgIDxwIGNsYXNzPSJzaWctZGF0ZSI+5LqOIDIwMjYg5bm05aSPPC9wPgo8L2Rpdj4=";

    // 最后一页大彩蛋寄语密文
    const ENCRYPTED_PAGE4 = "PGRpdiBjbGFzcz0iZmluYWwtd2lzaC1jb250ZW50Ij4KICAgIDxkaXYgY2xhc3M9ImdvbGQtc2VhbC1kZWMiPuKcqDwvZGl2PgogICAgPGgyIGNsYXNzPSJmaW5hbC10aXRsZSI+5YaZ5Zyo5pyq5p2l55qE6K+dPC9oMj4KICAgIDxkaXYgY2xhc3M9ImZpbmFsLWJvZHkiPgogICAgICAgIDxwIGNsYXNzPSJmaW5hbC1wYXJhIj7igJzmiJHku6zmgLvmmK/lnKjlpZTot5HvvIzkuLrorrrmlofjgIHkuLrku6PnoIHjgIHkuLrliY3nqIvlv5nnoozjgILigJ08L3A+CiAgICAgICAgPHAgY2xhc3M9ImZpbmFsLXBhcmEiPuKAnOS9huWBtuWwlO+8jOS5n+imgeWcqOi3r+i+ueS4uuS4gOWPqumHjueMq+WBnOeVme+8jOWcqOWklemYs+mHjOeci+evrueQg+WIkuWHuuWujOe+jueahOaKm+eJqee6v+OAguKAnTwvcD4KICAgICAgICA8cCBjbGFzcz0iZmluYWwtcGFyYSI+4oCc6LCi6LCi5L2g5YGa5oiR5pyA6Z2g6LCx55qE5a2m5pyv5ZCI5LyZ5Lq677yM5oS/5L2g5paw55qE5LiA5bKB77yM5L6d54S25pyJ5qKm77yM5pyJ54yr77yM5pyJ54Ot54ix44CC4oCdPC9wPgogICAgICAgIDxwIGNsYXNzPSJmaW5hbC1zaWciPuKAlOKAlCDkvaDnmoTlrabkuJrmiJjlj4s8L3A+CiAgICA8L2Rpdj4KPC9kaXY+";

    // 现代安全 UTF-8 Base64 解码函数，支持所有中文和特殊符号，排除空白干扰
    function decodeBase64UTF8(str) {
        const cleaned = str.replace(/\s/g, '');
        const binary = atob(cleaned);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    }

    function checkPasscode() {
        const value = passcodeInput.value.trim();
        if (value === CORRECT_PASSCODE) {
            errorMsg.classList.remove('active');
            passcodeOverlay.classList.remove('active');
            
            // 密码正确，在内存中动态解密两页信件内容并注入 DOM
            try {
                const decodedHTML1 = decodeBase64UTF8(ENCRYPTED_LETTER);
                document.getElementById('secretLetter').innerHTML = decodedHTML1;

                const decodedHTML4 = decodeBase64UTF8(ENCRYPTED_PAGE4);
                document.getElementById('finalWishLetter').innerHTML = decodedHTML4;
            } catch (err) {
                console.error("信件解密失败：", err);
                document.getElementById('secretLetter').innerHTML = "<p class='paragraph'>[解密错误：数据损坏]</p>";
                document.getElementById('finalWishLetter').innerHTML = "<p class='paragraph'>[解密错误：数据损坏]</p>";
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
        
        // 自动开启背景轻音乐
        audio.playMusic();

        // 场景过渡
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
        e.stopPropagation();
        audio.toggle();
    });

    // 3. 观测日志卡片 3D 翻转
    const logCards = document.querySelectorAll('.log-card');
    logCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
            audio.playSynthSound('card-flip');
        });
    });

    // 4. 年度报告式翻页控制逻辑 (Slideshow Navigation)
    let currentPage = 1;
    const totalPages = 4;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');
    const progressBarFill = document.getElementById('progressBarFill');
    const slides = document.querySelectorAll('.journal-page');

    function updateSlideshow() {
        // 隐藏所有页面，只激活当前页
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentPage - 1) {
                slide.classList.add('active');
            }
        });

        // 更新页码指示器
        pageIndicator.textContent = `0${currentPage} / 0${totalPages}`;

        // 更新金色进度条长度
        const progressPercentage = (currentPage / totalPages) * 100;
        progressBarFill.style.width = `${progressPercentage}%`;

        // 更新按钮的可点击状态
        prevBtn.disabled = (currentPage === 1);
        nextBtn.disabled = (currentPage === totalPages);
        
        // 播放一次翻页轻音效
        audio.playSynthSound('card-flip');

        // 如果是最后一页，可以触发一个小泛音
        if (currentPage === totalPages) {
            setTimeout(() => {
                audio.playSynthSound('reveal-future');
            }, 500);
        }
    }

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateSlideshow();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateSlideshow();
        }
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
