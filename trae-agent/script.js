/* ==========================================
   慢时光咖啡 - 交互脚本
   包含：导航栏滚动效果、汉堡菜单、英雄轮播、
        菜单分类切换、滚动高亮、表单提交
   ========================================== */

// ===== 菜单数据 =====
const menuData = {
  hot: [
    {
      name: "经典美式",
      desc: "浓缩咖啡与热水的纯粹碰撞，苦香回甘",
      price: "¥22",
      img: "https://picsum.photos/seed/hot1/600/400"
    },
    {
      name: "焦糖拿铁",
      desc: "丝滑牛奶与焦糖酱的甜蜜邂逅",
      price: "¥32",
      img: "https://picsum.photos/seed/hot2/600/400"
    },
    {
      name: "卡布奇诺",
      desc: "浓缩、牛奶与奶泡的经典三重奏",
      price: "¥28",
      img: "https://picsum.photos/seed/hot3/600/400"
    },
    {
      name: "手冲耶加雪菲",
      desc: "埃塞俄比亚精品豆，花果香层次丰富",
      price: "¥38",
      img: "https://picsum.photos/seed/hot4/600/400"
    }
  ],
  cold: [
    {
      name: "冰美式",
      desc: "清爽冰镇，唤醒一天的活力",
      price: "¥24",
      img: "https://picsum.photos/seed/cold1/600/400"
    },
    {
      name: "冰摩卡",
      desc: "巧克力与咖啡的丝滑冰爽体验",
      price: "¥34",
      img: "https://picsum.photos/seed/cold2/600/400"
    },
    {
      name: "冷萃咖啡",
      desc: "12 小时低温慢萃，醇厚顺滑",
      price: "¥30",
      img: "https://picsum.photos/seed/cold3/600/400"
    },
    {
      name: "燕麦拿铁",
      desc: "植物奶醇香，健康轻负担",
      price: "¥32",
      img: "https://picsum.photos/seed/cold4/600/400"
    }
  ],
  dessert: [
    {
      name: "原味可颂",
      desc: "层层酥脆，黄油香气四溢",
      price: "¥18",
      img: "https://picsum.photos/seed/dessert1/600/400"
    },
    {
      name: "提拉米苏",
      desc: "经典意式甜点，咖啡与马斯卡彭的融合",
      price: "¥32",
      img: "https://picsum.photos/seed/dessert2/600/400"
    },
    {
      name: "蓝莓芝士蛋糕",
      desc: "酸甜蓝莓遇上浓郁芝士",
      price: "¥28",
      img: "https://picsum.photos/seed/dessert3/600/400"
    },
    {
      name: "巧克力布朗尼",
      desc: "浓郁巧克力，外脆内软",
      price: "¥22",
      img: "https://picsum.photos/seed/dessert4/600/400"
    }
  ]
};

// ===== 工具函数：安全获取元素 =====
function $(selector, parent = document) {
  return parent.querySelector(selector);
}
function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

// ===== 导航栏滚动效果 =====
function initNavbarScroll() {
  const navbar = $("#navbar");
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ===== 汉堡菜单 =====
function initHamburger() {
  const hamburger = $("#hamburger");
  const navMenu = $("#navMenu");
  if (!hamburger || !navMenu) return;

  const toggleMenu = () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("open");
  };

  hamburger.addEventListener("click", toggleMenu);

  // 点击导航链接后关闭菜单
  $$(".nav-link", navMenu).forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navMenu.classList.remove("open");
    });
  });
}

// ===== 英雄轮播 =====
function initCarousel() {
  const slides = $$(".slide");
  const dotsContainer = $("#dots");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");

  if (!slides.length || !dotsContainer) return;

  let current = 0;
  let timer = null;

  // 生成指示点
  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = $$(".dot", dotsContainer);

  function goTo(index) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
    resetTimer();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startTimer() {
    timer = setInterval(next, 5000);
  }
  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);

  startTimer();
}

// ===== 菜单分类切换 =====
function initMenuTabs() {
  const tabs = $$(".tab");
  const menuGrid = $("#menuGrid");
  if (!tabs.length || !menuGrid) return;

  function renderMenu(category) {
    const items = menuData[category] || [];
    menuGrid.innerHTML = items
      .map(
        item => `
        <article class="menu-card">
          <img src="${item.img}" alt="${item.name}" loading="lazy" />
          <div class="menu-card-body">
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
            <span class="menu-price">${item.price}</span>
          </div>
        </article>
      `
      )
      .join("");
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderMenu(tab.dataset.category);
    });
  });

  // 初始渲染热饮
  renderMenu("hot");
}

// ===== 滚动时导航项高亮 =====
function initScrollSpy() {
  const sections = $$("section[id]");
  const navLinks = $$(".nav-link");
  if (!sections.length || !navLinks.length) return;

  const onScroll = () => {
    const scrollPos = window.scrollY + 120;
    let currentId = sections[0].id;
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) {
        currentId = sec.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ===== 联系表单提交 =====
function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const originalText = btn.textContent;
    btn.textContent = "提交中...";
    btn.disabled = true;

    // 模拟提交
    setTimeout(() => {
      btn.textContent = "提交成功 ✓";
      form.reset();
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }, 800);
  });
}

// ===== 初始化 =====
document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initHamburger();
  initCarousel();
  initMenuTabs();
  initScrollSpy();
  initContactForm();
});
