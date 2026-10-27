/* ==========================================
   萌宠之家 · SPA 主脚本
   架构：Hash Router + localStorage 数据层
   ========================================== */

// ===== 工具函数 =====
function $(selector, parent = document) { return parent.querySelector(selector); }
function $$(selector, parent = document) { return Array.from(parent.querySelectorAll(selector)); }

function showToast(msg, type = "info", duration = 2000) {
  const container = $("#toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function openModal(htmlContent) {
  const overlay = $("#modalOverlay");
  const body = $("#modalBody");
  body.innerHTML = htmlContent;
  overlay.classList.add("show");
}
function closeModal() {
  $("#modalOverlay").classList.remove("show");
  $("#modalBody").innerHTML = "";
}
document.addEventListener("DOMContentLoaded", () => {
  $("#modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  $("#modalClose").addEventListener("click", closeModal);
});

function formatPrice(n) { return Number(n).toFixed(2); }
function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function getOrderId() { return "MC" + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100); }

// ===== 图片 fallback：优先本地，兜底用 emoji 占位 =====
// 把 seed 转成基础键 "cat-blue-1" → "cat-blue"
function petImg(seed, w = 800, h = 800) {
  const baseKey = seed.replace(/-\d+$/, "");
  const meta = PRODUCT_IMAGES[baseKey];
  if (meta && meta.local) return `images/products/${meta.local}`;
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect fill='%23FFF5F0' width='100%25' height='100%25'/><text x='50%25' y='50%25' font-size='120' text-anchor='middle' dominant-baseline='central'>🐾</text></svg>`;
}
function petImgFallback(seed, w = 800, h = 800) {
  return petImg(seed, w, h);
}

// ===== 数据层（localStorage）=====
const DB = {
  KEYS: {
    USERS: "mc_users",
    USER: "mc_current_user",
    CART: "mc_cart",
    ADDRESSES: "mc_addresses",
    ORDERS: "mc_orders",
    WELCOME_SHOWN: "mc_welcome_shown"
  },

  get(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  // 用户相关
  getUsers() { return this.get(this.KEYS.USERS, []); },
  saveUsers(users) { this.set(this.KEYS.USERS, users); },
  getCurrentUser() { return this.get(this.KEYS.USER, null); },
  setCurrentUser(u) { u ? this.set(this.KEYS.USER, u) : localStorage.removeItem(this.KEYS.USER); },

  // 购物车
  getCart() { return this.get(this.KEYS.CART, []); },
  saveCart(cart) { this.set(this.KEYS.CART, cart); },
  addToCart(productId, quantity = 1, selectedSize = "标准") {
    const cart = this.getCart();
    const idx = cart.findIndex(i => i.productId === productId && i.selectedSize === selectedSize);
    if (idx >= 0) cart[idx].quantity += quantity;
    else cart.push({ productId, quantity, selectedSize });
    this.saveCart(cart);
  },
  removeFromCart(productId, selectedSize) {
    let cart = this.getCart();
    cart = cart.filter(i => !(i.productId === productId && i.selectedSize === selectedSize));
    this.saveCart(cart);
  },
  updateCartQty(productId, selectedSize, qty) {
    const cart = this.getCart();
    const idx = cart.findIndex(i => i.productId === productId && i.selectedSize === selectedSize);
    if (idx >= 0) {
      cart[idx].quantity = Math.max(1, qty);
      this.saveCart(cart);
    }
  },
  clearCart() { this.saveCart([]); },
  getCartCount() {
    return this.getCart().reduce((sum, i) => sum + i.quantity, 0);
  },
  getCartWithProducts() {
    const cart = this.getCart();
    return cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      return { ...item, product };
    }).filter(i => i.product);
  },

  // 地址
  getAddresses() { return this.get(this.KEYS.ADDRESSES, []); },
  saveAddresses(addr) { this.set(this.KEYS.ADDRESSES, addr); },
  getDefaultAddress() {
    const list = this.getAddresses();
    return list.find(a => a.isDefault) || list[0] || null;
  },

  // 订单
  getOrders() { return this.get(this.KEYS.ORDERS, []); },
  saveOrders(o) { this.set(this.KEYS.ORDERS, o); },
  addOrder(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);
  },
  getOrder(id) { return this.getOrders().find(o => o.id === id); },
  updateOrderStatus(id, status) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (o) { o.status = status; this.saveOrders(orders); }
  }
};

// ===== 产品目录（Mock 数据）=====
const PRODUCTS = [
  // 猫咪
  { id: "c01", name: "英短蓝猫 · 小蓝", category: "cat", price: 3800, originalPrice: 4500, images: ["cat-blue-1", "cat-blue-2", "cat-blue-3"], size: ["幼崽(2-3月)", "成猫(1岁)"], sales: 128, tags: ["热销"], desc: "英国短毛猫，性格温和，圆脸大眼，毛茸茸的蓝灰色被毛非常漂亮。性格独立但也很粘人，适合各种家庭环境。", reviewCount: 42 },
  { id: "c02", name: "布偶猫 · 云朵", category: "cat", price: 6800, originalPrice: 7800, images: ["ragdoll-1", "ragdoll-2", "ragdoll-3"], size: ["幼崽(2-3月)", "成猫(1岁)"], sales: 86, tags: ["新品"], desc: "布偶猫是出了名的温柔巨人，被抱在怀里就像抱着一团云朵。蓝眼睛、重点色毛发，颜值爆表。", reviewCount: 28 },
  { id: "c03", name: "橘猫 · 大橘", category: "cat", price: 1200, originalPrice: 1500, images: ["orange-cat-1", "orange-cat-2", "orange-cat-3"], size: ["幼崽(2-3月)", "成猫(1岁)"], sales: 256, tags: ["热销", "特价"], desc: "中华田园橘猫，十只橘猫九只胖！性格开朗活泼，特别能吃，是最亲民的萌宠之一。", reviewCount: 98 },
  { id: "c04", name: "美短 · 虎斑", category: "cat", price: 2800, originalPrice: 3200, images: ["mshorthair-1", "mshorthair-2", "mshorthair-3"], size: ["幼崽(2-3月)", "成猫(1岁)"], sales: 64, tags: [], desc: "美国短毛猫，经典虎斑花纹，活泼好动，身体健康，是非常好养的入门级品种。", reviewCount: 22 },
  { id: "c05", name: "暹罗猫 · 小挖", category: "cat", price: 2200, originalPrice: 2800, images: ["siamese-1", "siamese-2", "siamese-3"], size: ["幼崽(2-3月)", "成猫(1岁)"], sales: 45, tags: ["新品"], desc: "暹罗猫有着深邃的蓝眼睛和重点色毛色，非常聪明话多，喜欢和人互动，像小狗一样跟着你。", reviewCount: 15 },

  // 狗狗
  { id: "d01", name: "柯基 · 小短腿", category: "dog", price: 3500, originalPrice: 4200, images: ["corgi-1", "corgi-2", "corgi-3"], size: ["幼犬(2-3月)", "成犬(1岁)"], sales: 203, tags: ["热销"], desc: "矮脚小短腿、臀部大屁股，走路扭扭的柯基简直是天生的治愈系！性格友好，适合城市家庭。", reviewCount: 67 },
  { id: "d02", name: "金毛 · 小金", category: "dog", price: 2800, originalPrice: 3500, images: ["golden-1", "golden-2", "golden-3"], size: ["幼犬(2-3月)", "成犬(1岁)"], sales: 178, tags: ["热销"], desc: "金毛寻回犬是出了名的「大暖男」，性格温顺、聪明好学，是家庭和有小孩家庭的首选。", reviewCount: 89 },
  { id: "d03", name: "柴犬 · 小豆", category: "dog", price: 4200, originalPrice: 5000, images: ["shiba-1", "shiba-2", "shiba-3"], size: ["幼犬(2-3月)", "成犬(1岁)"], sales: 156, tags: ["热销", "新品"], desc: "来自日本的微笑柴犬，表情丰富，独立坚强，颜值和表情包界的天花板。", reviewCount: 55 },
  { id: "d04", name: "泰迪 · 毛球", category: "dog", price: 1800, originalPrice: 2200, images: ["poodle-1", "poodle-2", "poodle-3"], size: ["幼犬(2-3月)", "成犬(1岁)"], sales: 312, tags: ["热销"], desc: "泰迪（贵宾犬）聪明、不掉毛、体味小，体型小巧适合公寓饲养，是最受欢迎的城市伴侣犬。", reviewCount: 134 },
  { id: "d05", name: "哈士奇 · 二哈", category: "dog", price: 2500, originalPrice: 3000, images: ["husky-1", "husky-2", "husky-3"], size: ["幼犬(2-3月)", "成犬(1岁)"], sales: 98, tags: ["特价"], desc: "西伯利亚哈士奇，颜值与拆家能力并存的二哈！精力充沛，需要大量运动，是最有趣的狗狗之一。", reviewCount: 45 },

  // 小宠
  { id: "s01", name: "荷兰垂耳兔", category: "small", price: 350, originalPrice: 450, images: ["bunny-1", "bunny-2", "bunny-3"], size: ["幼年", "成年"], sales: 445, tags: ["热销"], desc: "软软糯糯的垂耳兔，耳朵垂下来超级可爱！温顺亲人，是入门级小宠的好选择。", reviewCount: 187 },
  { id: "s02", name: "金丝熊仓鼠", category: "small", price: 120, originalPrice: 150, images: ["hamster-1", "hamster-2", "hamster-3"], size: ["幼年", "成年"], sales: 678, tags: ["热销", "特价"], desc: "圆滚滚的金丝熊，大眼睛好奇地转来转去，养在笼子里萌化人心，养它只需要一点点空间。", reviewCount: 298 },
  { id: "s03", name: "安哥拉龙猫", category: "small", price: 580, originalPrice: 680, images: ["chinchilla-1", "chinchilla-2", "chinchilla-3"], size: ["幼年", "成年"], sales: 89, tags: ["新品"], desc: "毛茸茸的龙猫，有着世界上最柔软的毛发，性格温和，晚上比较活跃。", reviewCount: 34 },
  { id: "s04", name: "豚鼠 · 小团子", category: "small", price: 180, originalPrice: 220, images: ["guinea-1", "guinea-2", "guinea-3"], size: ["幼年", "成年"], sales: 234, tags: [], desc: "圆滚滚的豚鼠（荷兰猪），会发出各种可爱的声音，喜欢群居，建议两只一起养。", reviewCount: 78 },

  // 水族
  { id: "f01", name: "布偶斗鱼 · 火焰", category: "fish", price: 158, originalPrice: 198, images: ["betta-1", "betta-2", "betta-3"], size: ["成年"], sales: 567, tags: ["热销"], desc: "泰国斗鱼有着绚烂如火焰的大尾巴，性格好斗但对人类温柔。单只饲养在小缸里就是一件活的艺术品。", reviewCount: 223 },
  { id: "f02", name: "孔雀鱼 · 彩虹", category: "fish", price: 68, originalPrice: 88, images: ["guppy-1", "guppy-2", "guppy-3"], size: ["成年"], sales: 789, tags: ["热销", "特价"], desc: "孔雀鱼尾巴像彩虹一样绚烂多彩，好养又美丽，繁殖力极强，是新手入门的最佳选择。", reviewCount: 356 },
  { id: "f03", name: "迷你金鱼 · 水泡眼", category: "fish", price: 128, originalPrice: 168, images: ["goldfish-1", "goldfish-2", "goldfish-3"], size: ["成年"], sales: 345, tags: [], desc: "传统金鱼品种，水泡眼有着大大的泡泡眼，游起来摇摇摆摆极具观赏性。", reviewCount: 112 }
];

// ===== 真实宠物图片（Unsplash 直链 + 本地图片兜底）=====
// 所有 Unsplash photo ID 都经过浏览器验证返回 200 OK
const PRODUCT_IMAGES = {
  "cat-blue": { unsplash: "1629624467541-f73ef8f12df2", local: "british-shorthair.jpg" },
  "ragdoll": { unsplash: "1586289883499-f11d28aaf52f", local: "ragdoll.jpg" },
  "orange-cat": { unsplash: "1698170928357-a4671f4ef461", local: "orange-tabby.jpg" },
  "mshorthair": { unsplash: "1675504661658-33940d979a6a", local: "american-shorthair.jpg" },
  "siamese": { unsplash: "1472491235688-bdc81a63246e", local: "siamese.jpg" },
  "corgi": { unsplash: "1597633425046-08f5110420b5", local: "corgi.jpg" },
  "golden": { unsplash: "1530281700549-e82e7bf110d6", local: "golden-retriever.jpg" },
  "shiba": { unsplash: "1597633425046-08f5110420b5", local: "shiba-inu.jpg" },
  "poodle": { unsplash: "1530281700549-e82e7bf110d6", local: "poodle.jpg" },
  "husky": { unsplash: "1514888286974-6c03e2ca1dba", local: "husky.jpg" },
  "bunny": { unsplash: "1535241749838-299277b6305f", local: "holland-lop.jpg" },
  "hamster": { unsplash: "1425082661705-1834bfd09dca", local: "golden-hamster.jpg" },
  "chinchilla": { unsplash: "1514888286974-6c03e2ca1dba", local: "chinchilla.jpg" },
  "guinea": { unsplash: "1425082661705-1834bfd09dca", local: "guinea-pig.jpg" },
  "betta": { unsplash: "1522069169874-c58ec4b76be5", local: "betta-fish.jpg" },
  "guppy": { unsplash: "1522069169874-c58ec4b76be5", local: "guppy.jpg" },
  "goldfish": { unsplash: "1522069169874-c58ec4b76be5", local: "goldfish.jpg" }
};

function getProductImage(seed, idx = 0) {
  // 从 "cat-blue-1" 中提取基础键 "cat-blue"
  const baseKey = seed.replace(/-\d+$/, "");
  const meta = PRODUCT_IMAGES[baseKey];
  if (!meta) return `https://picsum.photos/seed/${baseKey}-${idx}/800/800`;
  // 用 Unsplash 直链，浏览器加载稳定
  return `https://images.unsplash.com/photo-${meta.unsplash}?w=800&h=800&fit=crop&auto=format`;
}

function getProductFallbackImage(seed) {
  const baseKey = seed.replace(/-\d+$/, "");
  const meta = PRODUCT_IMAGES[baseKey];
  if (meta && meta.local) return `images/products/${meta.local}`;
  return `https://picsum.photos/seed/${baseKey}/800/800`;
}

function getProductMainImage(product) {
  return getProductImage(product.images[0], 0);
}

function getProductAllImages(product) {
  return product.images.map((seed, i) => getProductImage(seed, i));
}

// ===== 热门产品 =====
function getHotProducts() {
  return [...PRODUCTS].sort((a, b) => b.sales - a.sales).slice(0, 8);
}
function getNewProducts() {
  return PRODUCTS.filter(p => p.tags.includes("新品")).slice(0, 6);
}
function getCategoryProducts(cat) {
  return PRODUCTS.filter(p => p.category === cat);
}

// ===== Hash Router =====
const Router = {
  routes: [],
  currentHash: "",

  addRoute(pattern, handler) {
    this.routes.push({ pattern, handler });
  },

  parseParams(pattern, hash) {
    const pParts = pattern.split("/").filter(Boolean);
    const hParts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const params = {};
    if (pParts.length !== hParts.length) return null;
    for (let i = 0; i < pParts.length; i++) {
      if (pParts[i].startsWith(":")) {
        params[pParts[i].slice(1)] = decodeURIComponent(hParts[i]);
      } else if (pParts[i] !== hParts[i]) {
        return null;
      }
    }
    return params;
  },

  match(hash) {
    hash = hash || "#/";
    for (const r of this.routes) {
      const params = this.parseParams(r.pattern, hash);
      if (params !== null) {
        return { handler: r.handler, params };
      }
    }
    return null;
  },

  navigate() {
    const hash = location.hash || "#/";
    this.currentHash = hash;
    const match = this.match(hash);
    const main = $("#app-view");
    if (!main) return;

    main.style.opacity = "0";
    setTimeout(() => {
      if (match) {
        match.handler(match.params);
      } else {
        renderNotFound();
      }
      main.style.opacity = "1";
      updateNavActive(hash);
      document.documentElement.scrollTop = 0;
    }, 150);
  },

  init() {
    window.addEventListener("hashchange", () => this.navigate());
    this.navigate();
  }
};

// ===== 导航激活状态 =====
function updateNavActive(hash) {
  $$(".nav-link").forEach(link => {
    const h = link.getAttribute("data-hash");
    if (hash === "#/" || hash === "") {
      link.classList.toggle("active", h === "#/");
    } else {
      link.classList.toggle("active", hash.startsWith(h) && h !== "#/" || (hash === h));
    }
  });
  $$(".tab-item").forEach(link => {
    const h = link.getAttribute("data-hash");
    link.classList.toggle("active", hash === h || (hash.startsWith(h) && h !== "#/"));
  });
}

// ===== 导航栏/用户/购物车状态更新 =====
function updateCartBadge() {
  const count = DB.getCartCount();
  $("#cartBadge").textContent = count;
  $("#cartBadge").style.display = count > 0 ? "flex" : "none";
  $("#mobileCartBadge").textContent = count;
  $("#mobileCartBadge").style.display = count > 0 ? "flex" : "none";
}

function updateUserArea() {
  const user = DB.getCurrentUser();
  const loginBtn = $("#loginBtn");
  const userMenu = $("#userMenu");
  const userAvatar = $("#userAvatar");
  const userNickname = $("#userNickname");

  if (user) {
    loginBtn.classList.add("hidden");
    userMenu.classList.remove("hidden");
    userNickname.textContent = user.nickname || user.phone.slice(-4);
    if (user.avatar) userAvatar.textContent = user.avatar;
  } else {
    loginBtn.classList.remove("hidden");
    userMenu.classList.add("hidden");
  }
}

function updateAllStatus() {
  updateCartBadge();
  updateUserArea();
}

// ===== 页面：首页 =====
function renderHome() {
  const main = $("#app-view");
  const hotProducts = getHotProducts();
  const newProducts = getNewProducts();
  const categories = [
    { key: "cat", emoji: "🐱", name: "猫咪" },
    { key: "dog", emoji: "🐶", name: "狗狗" },
    { key: "small", emoji: "🐰", name: "小宠" },
    { key: "fish", emoji: "🐠", name: "水族" },
    { key: "all", emoji: "✨", name: "全部" }
  ];

  main.innerHTML = `
    <!-- 英雄轮播 -->
    <section class="hero">
      <div class="hero-carousel" id="heroCarousel">
        <div class="hero-slide active" style="background-image: url('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&h=600&fit=crop')">
          <div class="hero-slide-content">
            <h1>领养一只小萌宠</h1>
            <p>让温暖走进你的生活，成为彼此最重要的陪伴</p>
            <a href="#/category/cat" class="btn btn-primary">立即挑选 →</a>
          </div>
        </div>
        <div class="hero-slide" style="background-image: url('https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1600&h=600&fit=crop')">
          <div class="hero-slide-content">
            <h1>新用户注册立减 50 元</h1>
            <p>首单还有更多惊喜等你发现</p>
            <a href="#/login" class="btn btn-primary">马上注册 →</a>
          </div>
        </div>
        <div class="hero-slide" style="background-image: url('https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=1600&h=600&fit=crop')">
          <div class="hero-slide-content">
            <h1>精选健康萌宠</h1>
            <p>每一只都经过严格筛选，确保健康活泼</p>
            <a href="#/category/dog" class="btn btn-primary">查看品种 →</a>
          </div>
        </div>
      </div>
      <button class="hero-btn prev" id="heroPrev">‹</button>
      <button class="hero-btn next" id="heroNext">›</button>
      <div class="hero-dots" id="heroDots"></div>
    </section>

    <div class="container">
      <!-- 分类入口 -->
      <section class="section">
        <div class="section-title">
          <h2>选择你的萌宠</h2>
        </div>
        <div class="category-grid">
          ${categories.map(c => `
            <a href="#/category/${c.key}" class="category-card">
              <span class="category-emoji">${c.emoji}</span>
              <span>${c.name}</span>
            </a>
          `).join("")}
        </div>
      </section>

      <!-- 新品推荐 -->
      ${newProducts.length ? `
      <section class="section">
        <div class="section-title">
          <h2>✨ 新品推荐</h2>
          <a href="#/category/all" class="more">查看更多 →</a>
        </div>
        <div class="recommend-scroll" id="recommendScroll">
          ${newProducts.map(p => renderProductCard(p)).join("")}
        </div>
      </section>
      ` : ""}

      <!-- 热销排行 -->
      <section class="section">
        <div class="section-title">
          <h2>🔥 热销排行</h2>
          <a href="#/category/all" class="more">全部热销 →</a>
        </div>
        <div class="product-grid">
          ${hotProducts.map(p => renderProductCard(p)).join("")}
        </div>
      </section>
    </div>
  `;

  initHeroCarousel();
  bindProductClicks();
}

function renderProductCard(p) {
  const img = getProductMainImage(p);
  const tagBadges = p.tags.map(t => {
    if (t === "热销") return '<span class="badge badge-hot">🔥 热销</span>';
    if (t === "新品") return '<span class="badge badge-new">✨ 新品</span>';
    if (t === "特价") return '<span class="badge badge-sale">💰 特价</span>';
    return "";
  }).join("");
  return `
    <a href="#/product/${p.id}" class="product-card" data-product-id="${p.id}">
      <div class="product-image">
        <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='${petImgFallback(p.images[0])}'">
        <div class="product-tags">${tagBadges}</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-sales">已售 ${p.sales} 只</div>
        <div class="product-price-row">
          <span class="product-price">¥${formatPrice(p.price)}</span>
          ${p.originalPrice > p.price ? `<span class="product-original-price">¥${formatPrice(p.originalPrice)}</span>` : ""}
        </div>
      </div>
    </a>
  `;
}

function initHeroCarousel() {
  const slides = $$(".hero-slide");
  const dotsContainer = $("#heroDots");
  const prev = $("#heroPrev");
  const next = $("#heroNext");
  if (!slides.length || !dotsContainer) return;

  let current = 0;
  let timer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "hero-dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });
  const dots = $$(".hero-dot");

  function goTo(idx) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
    resetTimer();
  }
  function nextSlide() { goTo(current + 1); }
  function prevSlide() { goTo(current - 1); }
  function startTimer() { timer = setInterval(nextSlide, 5000); }
  function resetTimer() { clearInterval(timer); startTimer(); }

  if (prev) prev.addEventListener("click", prevSlide);
  if (next) next.addEventListener("click", nextSlide);
  startTimer();
}

function bindProductClicks() {
  // product-card 已经是 <a> 标签，天然绑定
}

// ===== 页面：商品列表 =====
let listState = { category: "all", sort: "sales" };

function renderCategory({ cat = "all" }) {
  const main = $("#app-view");
  listState.category = cat;

  let products;
  if (cat === "all") products = [...PRODUCTS];
  else products = getCategoryProducts(cat);

  // 排序
  products = sortProducts(products, listState.sort);

  const catNames = { cat: "猫咪", dog: "狗狗", small: "小宠", fish: "水族", all: "全部" };
  const catTabs = [
    { key: "all", name: "全部" },
    { key: "cat", name: "猫咪" },
    { key: "dog", name: "狗狗" },
    { key: "small", name: "小宠" },
    { key: "fish", name: "水族" }
  ];
  const sorts = [
    { key: "sales", name: "🔥 热销" },
    { key: "priceAsc", name: "价格↑" },
    { key: "priceDesc", name: "价格↓" },
    { key: "newest", name: "✨ 新品" }
  ];

  main.innerHTML = `
    <div class="container">
      <div class="list-header">
        <h1>${catNames[cat] || "全部"}</h1>
        <p style="color: var(--text-light); font-size: 14px; margin-top: 4px;">共 ${products.length} 只萌宠等你挑选</p>
      </div>

      <div class="list-filters">
        <div class="list-tabs">
          ${catTabs.map(t => `<a href="#/category/${t.key}" class="list-tab ${t.key === cat ? "active" : ""}">${t.name}</a>`).join("")}
        </div>
        <div class="list-sort" id="listSort">
          ${sorts.map(s => `<button class="sort-btn ${s.key === listState.sort ? "active" : ""}" data-sort="${s.key}">${s.name}</button>`).join("")}
        </div>
      </div>

      ${products.length ? `
      <div class="product-grid">
        ${products.map(p => renderProductCard(p)).join("")}
      </div>
      ` : `
      <div style="text-align: center; padding: 80px 24px; color: var(--text-light);">
        <div style="font-size: 60px; margin-bottom: 16px;">🐾</div>
        <p>这个分类暂时没有萌宠哦~</p>
      </div>
      `}
    </div>
  `;

  // 排序按钮绑定
  $("#listSort").addEventListener("click", (e) => {
    const btn = e.target.closest(".sort-btn");
    if (btn) {
      listState.sort = btn.dataset.sort;
      renderCategory({ cat: listState.category });
    }
  });
}

function sortProducts(list, sortKey) {
  const arr = [...list];
  switch (sortKey) {
    case "priceAsc": return arr.sort((a, b) => a.price - b.price);
    case "priceDesc": return arr.sort((a, b) => b.price - a.price);
    case "newest": return arr.filter(p => p.tags.includes("新品")).concat(arr.filter(p => !p.tags.includes("新品")));
    case "sales":
    default: return arr.sort((a, b) => b.sales - a.sales);
  }
}

// ===== 页面：商品详情 =====
function renderProduct({ id }) {
  const main = $("#app-view");
  const product = PRODUCTS.find(p => p.id === id);

  if (!product) {
    main.innerHTML = `<div class="container" style="text-align:center; padding:80px 24px; color:var(--text-light);"><p>没有找到这只萌宠 🐾</p><a href="#/" class="btn btn-primary" style="margin-top:16px; display:inline-block;">返回首页</a></div>`;
    return;
  }

  const images = getProductAllImages(product);
  const categoryNames = { cat: "猫咪", dog: "狗狗", small: "小宠", fish: "水族" };

  // 示例评价
  const reviews = generateReviews(product);

  main.innerHTML = `
    <div class="container">
      <div class="detail-header">
        <a href="#/">首页</a> &nbsp;›&nbsp;
        <a href="#/category/${product.category}">${categoryNames[product.category]}</a> &nbsp;›&nbsp;
        <span>${product.name}</span>
      </div>

      <div class="detail-container">
        <!-- 图片区 -->
        <div class="detail-gallery">
          <div class="detail-main-image" id="detailMainImage">
            <img src="${images[0]}" alt="${product.name}" onerror="this.src='${petImgFallback(product.images[0])}'">
          </div>
          <div class="detail-thumbnails">
            ${images.map((img, i) => `
              <div class="detail-thumb ${i === 0 ? "active" : ""}" data-idx="${i}">
                <img src="${img}" alt="" onerror="this.src='${petImgFallback(product.images[0] + i)}'">
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 信息区 -->
        <div class="detail-info">
          <h1>${product.name}</h1>
          <div class="detail-price-row">
            <span class="detail-price">¥${formatPrice(product.price)}</span>
            ${product.originalPrice > product.price ? `<span class="detail-original-price">¥${formatPrice(product.originalPrice)}</span>` : ""}
            <span class="detail-sales">已售 ${product.sales} 只</span>
          </div>

          <div class="detail-meta">
            <span>🐾 分类：<strong>${categoryNames[product.category]}</strong></span>
            <span>📦 包邮到家</span>
            <span>🛡️ 15天健康保障</span>
          </div>

          <div class="detail-section-title">选择体型</div>
          <div class="size-options">
            ${product.size.map((s, i) => `<button class="size-btn ${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>`).join("")}
          </div>

          <div class="detail-desc">
            <div class="detail-section-title">萌宠介绍</div>
            <p>${product.desc}</p>
            <img src="${petImgFallback(product.images[0] + '-desc', 800, 400)}" alt="详情图" onerror="this.style.display='none'">
          </div>

          <div class="detail-bottom-bar">
            <button class="btn btn-secondary btn-lg" id="addToCartBtn">🛒 加入购物车</button>
            <button class="btn btn-primary btn-lg" id="buyNowBtn">⚡ 立即购买</button>
          </div>
        </div>
      </div>

      <!-- 用户评价 -->
      <div class="reviews-section">
        <div class="section-title">
          <h2>💬 用户评价 (${reviews.length})</h2>
        </div>
        ${reviews.map(r => `
          <div class="review-item">
            <div class="review-header">
              <div class="review-avatar">${r.avatar}</div>
              <span class="review-name">${r.name}</span>
              <span class="review-date">${r.date}</span>
              <span class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
            </div>
            <div class="review-content">${r.content}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // 缩略图切换
  $$(".detail-thumb").forEach(t => {
    t.addEventListener("click", () => {
      $$(".detail-thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const idx = Number(t.dataset.idx);
      const mainImg = $("#detailMainImage img");
      mainImg.src = images[idx];
    });
  });

  // 尺寸选择
  let selectedSize = product.size[0];
  $$(".size-btn").forEach(b => {
    b.addEventListener("click", () => {
      $$(".size-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      selectedSize = b.dataset.size;
    });
  });

  // 加入购物车
  $("#addToCartBtn").addEventListener("click", () => {
    const user = DB.getCurrentUser();
    if (!user) {
      openModal(`
        <div style="text-align:center;">
          <div style="font-size:48px; margin-bottom:12px;">🔐</div>
          <h3 style="margin-bottom:8px;">请先登录</h3>
          <p style="color:var(--text-light); margin-bottom:20px; font-size:14px;">登录后才能将萌宠加入购物车哦~</p>
          <a href="#/login" class="btn btn-primary btn-block" onclick="closeModal()">去登录</a>
        </div>
      `);
      return;
    }
    DB.addToCart(product.id, 1, selectedSize);
    updateCartBadge();
    showToast("已加入购物车 🐾", "success");
  });

  // 立即购买
  $("#buyNowBtn").addEventListener("click", () => {
    const user = DB.getCurrentUser();
    if (!user) {
      openModal(`
        <div style="text-align:center;">
          <div style="font-size:48px; margin-bottom:12px;">🔐</div>
          <h3 style="margin-bottom:8px;">请先登录</h3>
          <p style="color:var(--text-light); margin-bottom:20px; font-size:14px;">登录后才能下单哦~</p>
          <a href="#/login" class="btn btn-primary btn-block" onclick="closeModal()">去登录</a>
        </div>
      `);
      return;
    }
    DB.clearCart();
    DB.addToCart(product.id, 1, selectedSize);
    updateCartBadge();
    location.hash = "#/checkout";
  });
}

function generateReviews(product) {
  const names = ["小*花", "大*明", "喵星人爱好者", "汪星人爸爸", "匿名用户", "爱宠人士", "养宠新手", "资深铲屎官"];
  const avatars = ["🐱", "🐶", "🐰", "🐾", "🐾", "🐱", "🐰", "🐶"];
  const comments = [
    "超可爱！接到家第一时间就适应了，很活泼健康！",
    "比照片还好看！性格特别温顺，家人都很喜欢。",
    "收到后非常惊喜，状态很好，客服也很耐心。",
    "包装很专业，运输过程也很安全，点赞！",
    "已经是第二次回购了，还是一样的好。",
    "小家伙特别粘人，每天都给我带来很多快乐~",
    "体质很棒，来家后食欲很好，很快就长胖了。",
    "对比了好几家最终选了这家，非常值得信赖！"
  ];
  const count = Math.min(6, product.reviewCount);
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      name: names[i % names.length],
      avatar: avatars[i % avatars.length],
      rating: 4 + Math.floor(Math.random() * 2),
      content: comments[i % comments.length],
      date: `2026-${String(8 + i).padStart(2, "0")}-${String(10 + i * 3).padStart(2, "0")}`
    });
  }
  return arr;
}

// ===== 页面：登录/注册 =====
let authTab = "login";

function renderLogin() {
  const main = $("#app-view");

  main.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div style="text-align:center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🐾</div>
          <h2>欢迎来到萌宠之家</h2>
          <p style="color: var(--text-light); font-size: 14px;">登录后即可领养你的专属萌宠</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab ${authTab === "login" ? "active" : ""}" data-tab="login">登录</button>
          <button class="auth-tab ${authTab === "register" ? "active" : ""}" data-tab="register">注册</button>
        </div>

        <form id="authForm" novalidate>
          ${authTab === "login" ? renderLoginForm() : renderRegisterForm()}
        </form>

        <div class="auth-divider">其他方式登录</div>
        <button type="button" class="btn-wechat" id="wechatLoginBtn">
          <span>💬</span> 微信一键登录
        </button>
      </div>
    </div>
  `;

  $$(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      authTab = tab.dataset.tab;
      renderLogin();
    });
  });

  const form = $("#authForm");
  if (authTab === "login") {
    form.addEventListener("submit", handleLogin);
    $("#sendCodeBtn").addEventListener("click", sendAuthCode);
  } else {
    form.addEventListener("submit", handleRegister);
    $("#sendCodeBtn").addEventListener("click", sendAuthCode);
  }

  $("#wechatLoginBtn").addEventListener("click", () => {
    showToast("正在唤起微信...", "info");
    setTimeout(() => {
      const users = DB.getUsers();
      let user = users.find(u => u.phone === "wechat_user");
      if (!user) {
        user = { phone: "wechat_user", nickname: "微信用户", avatar: "🐱" };
        users.push(user);
        DB.saveUsers(users);
      }
      DB.setCurrentUser(user);
      updateAllStatus();
      showToast("登录成功！欢迎回来 🐾", "success");
      setTimeout(() => location.hash = "#/", 800);
    }, 1200);
  });
}

function renderLoginForm() {
  return `
    <div class="form-group">
      <label class="form-label">手机号</label>
      <input type="tel" class="form-input" id="authPhone" placeholder="请输入 11 位手机号" maxlength="11" required>
    </div>
    <div class="form-group">
      <label class="form-label">验证码</label>
      <div class="code-row">
        <input type="text" class="form-input" id="authCode" placeholder="请输入验证码" maxlength="6" required>
        <button type="button" class="btn-code" id="sendCodeBtn">获取验证码</button>
      </div>
      <div class="form-hint">💡 演示环境，验证码固定为 <strong>123456</strong></div>
    </div>
    <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 12px;">登录</button>
    <div class="form-error" id="authError" style="display:none;"></div>
  `;
}

function renderRegisterForm() {
  return `
    <div class="form-group">
      <label class="form-label">手机号</label>
      <input type="tel" class="form-input" id="authPhone" placeholder="请输入 11 位手机号" maxlength="11" required>
    </div>
    <div class="form-group">
      <label class="form-label">验证码</label>
      <div class="code-row">
        <input type="text" class="form-input" id="authCode" placeholder="请输入验证码" maxlength="6" required>
        <button type="button" class="btn-code" id="sendCodeBtn">获取验证码</button>
      </div>
      <div class="form-hint">💡 演示环境，验证码固定为 <strong>123456</strong></div>
    </div>
    <div class="form-group">
      <label class="form-label">昵称</label>
      <input type="text" class="form-input" id="authNickname" placeholder="给自己起个可爱的名字吧~" maxlength="20" required>
    </div>
    <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 12px;">注册</button>
    <div class="form-error" id="authError" style="display:none;"></div>
  `;
}

let codeCountdown = 0;
function sendAuthCode() {
  const phone = $("#authPhone").value.trim();
  const btn = $("#sendCodeBtn");
  if (!/^1\d{10}$/.test(phone)) {
    showAuthError("请输入正确的手机号");
    return;
  }
  showToast("验证码已发送：123456", "success");
  codeCountdown = 60;
  btn.disabled = true;
  const timer = setInterval(() => {
    codeCountdown--;
    btn.textContent = `${codeCountdown}秒后重发`;
    if (codeCountdown <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.textContent = "获取验证码";
    }
  }, 1000);
}

function showAuthError(msg) {
  const el = $("#authError");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 3000);
}

function handleLogin(e) {
  e.preventDefault();
  const phone = $("#authPhone").value.trim();
  const code = $("#authCode").value.trim();

  if (!/^1\d{10}$/.test(phone)) { showAuthError("请输入正确的手机号"); return; }
  if (code !== "123456") { showAuthError("验证码错误，请使用 123456"); return; }

  const users = DB.getUsers();
  let user = users.find(u => u.phone === phone);
  if (!user) {
    // 自动注册
    user = { phone, nickname: `用户${phone.slice(-4)}`, avatar: "🐱" };
    users.push(user);
    DB.saveUsers(users);
  }
  DB.setCurrentUser(user);
  updateAllStatus();
  showToast(`欢迎回来，${user.nickname} 🐾`, "success");
  setTimeout(() => location.hash = "#/", 800);
}

function handleRegister(e) {
  e.preventDefault();
  const phone = $("#authPhone").value.trim();
  const code = $("#authCode").value.trim();
  const nickname = $("#authNickname").value.trim();

  if (!/^1\d{10}$/.test(phone)) { showAuthError("请输入正确的手机号"); return; }
  if (code !== "123456") { showAuthError("验证码错误，请使用 123456"); return; }
  if (nickname.length < 2) { showAuthError("昵称至少 2 个字符"); return; }

  const users = DB.getUsers();
  if (users.find(u => u.phone === phone)) {
    showAuthError("该手机号已注册，请直接登录");
    return;
  }

  const user = { phone, nickname, avatar: ["🐱", "🐶", "🐰", "🐾", "🦊"][Math.floor(Math.random() * 5)] };
  users.push(user);
  DB.saveUsers(users);
  DB.setCurrentUser(user);
  updateAllStatus();
  showToast(`注册成功！新用户立减 ¥50 🎁`, "success");
  // 隐藏欢迎弹窗
  localStorage.setItem("mc_welcome_shown", "1");
  setTimeout(() => location.hash = "#/", 1000);
}

// ===== 页面：购物车 =====
function renderCart() {
  const main = $("#app-view");
  const cart = DB.getCartWithProducts();

  if (!cart.length) {
    main.innerHTML = `
      <div class="container">
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h3>购物车空空如也</h3>
          <p>快去挑选心仪的萌宠吧~</p>
          <a href="#/" class="btn btn-primary">立即逛逛 →</a>
        </div>
      </div>
    `;
    return;
  }

  // 状态：默认全选
  if (!window._cartSelected) {
    window._cartSelected = cart.map(i => i.productId + "|" + i.selectedSize);
  }

  let selectedIds = window._cartSelected;

  const cartHTML = cart.map(item => {
    const key = item.productId + "|" + item.selectedSize;
    const checked = selectedIds.includes(key);
    const img = getProductMainImage(item.product);
    return `
      <div class="cart-item" data-key="${key}">
        <div class="cart-checkbox ${checked ? "checked" : ""}" data-key="${key}"></div>
        <div class="cart-thumb"><img src="${img}" onerror="this.src='${petImgFallback(item.product.images[0])}'"></div>
        <div>
          <div class="cart-item-name">${item.product.name}</div>
          <div class="cart-item-size">${item.selectedSize}</div>
        </div>
        <div class="cart-item-price">¥${formatPrice(item.product.price)}</div>
        <div class="qty-control">
          <button class="qty-btn qty-minus" data-key="${key}">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn qty-plus" data-key="${key}">+</button>
        </div>
        <div class="cart-item-subtotal">¥${formatPrice(item.product.price * item.quantity)}</div>
        <button class="cart-item-remove" data-key="${key}">删除</button>
      </div>
    `;
  }).join("");

  const totalPrice = cart.reduce((sum, item) => {
    const key = item.productId + "|" + item.selectedSize;
    return selectedIds.includes(key) ? sum + item.product.price * item.quantity : sum;
  }, 0);
  const totalCount = cart.reduce((sum, item) => {
    const key = item.productId + "|" + item.selectedSize;
    return selectedIds.includes(key) ? sum + item.quantity : sum;
  }, 0);
  const allSelected = cart.every(item => selectedIds.includes(item.productId + "|" + item.selectedSize));

  main.innerHTML = `
    <div class="container">
      <div class="cart-page">
        <div class="cart-header">
          <h1>购物车 (${cart.length})</h1>
        </div>

        <div class="cart-list" id="cartList">
          ${cartHTML}
        </div>

        <div class="cart-footer">
          <label class="select-all">
            <div class="cart-checkbox ${allSelected ? "checked" : ""}" id="selectAll"></div>
            <span>全选</span>
          </label>
          <div class="cart-footer-center">
            <div class="cart-total-label">已选 ${totalCount} 只</div>
            <div class="cart-total-price">${formatPrice(totalPrice)}</div>
          </div>
          <button class="btn-checkout" id="checkoutBtn" ${totalCount === 0 ? "disabled" : ""}>去结算</button>
        </div>
      </div>
    </div>
  `;

  // 勾选
  $$(".cart-checkbox").forEach(cb => {
    if (cb.id === "selectAll") return;
    cb.addEventListener("click", () => {
      const key = cb.dataset.key;
      if (window._cartSelected.includes(key)) {
        window._cartSelected = window._cartSelected.filter(k => k !== key);
      } else {
        window._cartSelected.push(key);
      }
      renderCart();
    });
  });

  // 全选
  $("#selectAll").addEventListener("click", () => {
    if (allSelected) {
      window._cartSelected = [];
    } else {
      window._cartSelected = cart.map(i => i.productId + "|" + i.selectedSize);
    }
    renderCart();
  });

  // 数量 ±
  $$(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const [pid, size] = key.split("|");
      const item = cart.find(i => i.productId === pid && i.selectedSize === size);
      if (!item) return;
      if (btn.classList.contains("plus")) {
        DB.updateCartQty(pid, size, item.quantity + 1);
      } else {
        if (item.quantity <= 1) {
          DB.removeFromCart(pid, size);
          window._cartSelected = window._cartSelected.filter(k => k !== key);
        } else {
          DB.updateCartQty(pid, size, item.quantity - 1);
        }
      }
      updateCartBadge();
      renderCart();
    });
  });

  // 删除
  $$(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const [pid, size] = key.split("|");
      DB.removeFromCart(pid, size);
      window._cartSelected = window._cartSelected.filter(k => k !== key);
      updateCartBadge();
      renderCart();
    });
  });

  // 去结算
  $("#checkoutBtn").addEventListener("click", () => {
    if (totalCount === 0) return;
    const user = DB.getCurrentUser();
    if (!user) {
      openModal(`
        <div style="text-align:center;">
          <div style="font-size:48px; margin-bottom:12px;">🔐</div>
          <h3 style="margin-bottom:8px;">请先登录</h3>
          <p style="color:var(--text-light); margin-bottom:20px; font-size:14px;">登录后才能下单哦~</p>
          <a href="#/login" class="btn btn-primary btn-block" onclick="closeModal()">去登录</a>
        </div>
      `);
      return;
    }
    // 保存选中项到 checkout session
    window._checkoutItems = window._cartSelected;
    location.hash = "#/checkout";
  });
}

// ===== 页面：结算 =====
function renderCheckout() {
  const main = $("#app-view");
  const user = DB.getCurrentUser();
  if (!user) {
    location.hash = "#/login";
    return;
  }

  // 获取选中项
  const selectedKeys = window._checkoutItems || window._cartSelected || [];
  let items;
  if (selectedKeys.length) {
    items = DB.getCartWithProducts().filter(i => selectedKeys.includes(i.productId + "|" + i.selectedSize));
  } else {
    items = DB.getCartWithProducts();
  }

  if (!items.length) {
    main.innerHTML = `<div class="container" style="text-align:center; padding:80px 24px;"><p>请先选择要结算的萌宠~</p><a href="#/cart" class="btn btn-primary" style="margin-top:16px; display:inline-block;">返回购物车</a></div>`;
    return;
  }

  const addresses = DB.getAddresses();
  const defaultAddr = DB.getDefaultAddress();

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 2000 ? 0 : 15;
  const total = subtotal + shipping;

  const addressHTML = defaultAddr ? `
    <div class="address-card selected" id="defaultAddressCard">
      <div class="address-top">
        <span class="address-name">${defaultAddr.name}</span>
        <span class="address-phone">${defaultAddr.phone}</span>
        <span class="address-tag">默认</span>
      </div>
      <div class="address-detail">${defaultAddr.province}${defaultAddr.city}${defaultAddr.detail}</div>
      <div class="address-actions">
        <button id="changeAddrBtn">更换地址</button>
      </div>
    </div>
  ` : `
    <div class="address-add" id="addAddressBtn">
      <span>➕</span>
      <div>添加收货地址</div>
    </div>
  `;

  main.innerHTML = `
    <div class="container">
      <div class="checkout-page">
        <div class="checkout-step">
          <div class="checkout-step-title">收货地址</div>
          ${addressHTML}
        </div>

        <div class="checkout-step">
          <div class="checkout-step-title">商品清单</div>
          ${items.map(i => {
            const img = getProductMainImage(i.product);
            return `
              <div class="checkout-item">
                <div class="cart-thumb"><img src="${img}" onerror="this.src='${petImgFallback(i.product.images[0])}'"></div>
                <div class="checkout-item-info">
                  <div class="name">${i.product.name}</div>
                  <div class="size">${i.selectedSize} × ${i.quantity}</div>
                </div>
                <div class="checkout-item-price">
                  <div style="color: var(--primary-dark); font-weight: 600;">¥${formatPrice(i.product.price * i.quantity)}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="checkout-step">
          <div class="checkout-step-title">订单金额</div>
          <div class="price-breakdown">
            <div class="price-row"><span class="label">商品总额</span><span>¥${formatPrice(subtotal)}</span></div>
            <div class="price-row"><span class="label">运费</span><span>${shipping === 0 ? "包邮 🎉" : "¥" + formatPrice(shipping)}</span></div>
            <div class="price-row total"><span class="label">实付金额</span><span class="value">¥${formatPrice(total)}</span></div>
          </div>
        </div>

        <div class="checkout-footer">
          <div class="checkout-total">实付 <strong>¥${formatPrice(total)}</strong></div>
          <button class="btn btn-primary btn-lg" id="submitOrderBtn">提交订单</button>
        </div>
      </div>
    </div>
  `;

  // 添加地址
  if ($("#addAddressBtn")) {
    $("#addAddressBtn").addEventListener("click", () => openAddressModal(items, subtotal, shipping, total));
  }
  if ($("#changeAddrBtn")) {
    $("#changeAddrBtn").addEventListener("click", () => openAddressModal(items, subtotal, shipping, total));
  }

  // 提交订单
  $("#submitOrderBtn").addEventListener("click", () => {
    const addr = DB.getDefaultAddress();
    if (!addr) {
      showToast("请先添加收货地址", "error");
      return;
    }
    const orderItems = items.map(i => ({
      productId: i.productId,
      name: i.product.name,
      price: i.product.price,
      image: getProductMainImage(i.product),
      quantity: i.quantity,
      selectedSize: i.selectedSize
    }));
    const order = {
      id: getOrderId(),
      items: orderItems,
      subtotal, shipping, total,
      address: addr,
      paymentMethod: "",
      status: "pending",
      createTime: Date.now()
    };
    DB.addOrder(order);
    // 从购物车中移除已结算的商品
    selectedKeys.forEach(key => {
      const [pid, size] = key.split("|");
      DB.removeFromCart(pid, size);
    });
    window._cartSelected = [];
    window._checkoutItems = [];
    updateCartBadge();
    showToast("订单已创建，正在跳转支付...", "success");
    setTimeout(() => location.hash = `#/payment/${order.id}`, 800);
  });
}

function openAddressModal(currentItems, subtotal, shipping, total) {
  const addresses = DB.getAddresses();
  const isNew = addresses.length === 0;

  openModal(`
    <div style="padding: 0 0 16px;">
      <h3 style="margin-bottom: 16px; font-size: 18px;">${isNew ? "添加收货地址" : "选择收货地址"}</h3>

      ${!isNew ? `
        <div style="max-height: 300px; overflow-y: auto; margin-bottom: 12px;">
          ${addresses.map(a => `
            <div class="address-card ${a.isDefault ? "selected" : ""}" data-addr-id="${a.id}" style="margin-bottom: 10px;">
              <div class="address-top">
                <span class="address-name">${a.name}</span>
                <span class="address-phone">${a.phone}</span>
                ${a.isDefault ? '<span class="address-tag">默认</span>' : ""}
              </div>
              <div class="address-detail">${a.province}${a.city}${a.detail}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <div style="border-top: 1px dashed #F0E6DF; padding-top: 16px;">
        <div style="font-weight: 500; margin-bottom: 12px; font-size: 15px;">${isNew ? "" : "✏️ 新增地址"}</div>
        <div class="form-group" style="margin-bottom: 12px;">
          <input type="text" class="form-input" id="addrName" placeholder="收货人姓名" maxlength="10">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <input type="tel" class="form-input" id="addrPhone" placeholder="手机号码" maxlength="11">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <input type="text" class="form-input" id="addrProvince" placeholder="省/直辖市" value="上海市">
          <input type="text" class="form-input" id="addrCity" placeholder="市/区" value="上海市·静安区">
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <input type="text" class="form-input" id="addrDetail" placeholder="详细地址（街道、门牌号）">
        </div>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-light); margin-bottom: 16px;">
          <input type="checkbox" id="addrDefault" checked style="width:16px; height:16px;"> 设为默认地址
        </label>
        <button class="btn btn-primary btn-block" id="saveAddrBtn">保存并使用此地址</button>
      </div>
    </div>
  `);

  // 选择已有地址
  $$(".address-card[data-addr-id]").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.addrId;
      const list = DB.getAddresses();
      list.forEach(a => a.isDefault = a.id === id);
      DB.saveAddresses(list);
      closeModal();
      renderCheckout();
    });
  });

  // 保存新地址
  $("#saveAddrBtn").addEventListener("click", () => {
    const name = $("#addrName").value.trim();
    const phone = $("#addrPhone").value.trim();
    const province = $("#addrProvince").value.trim();
    const city = $("#addrCity").value.trim();
    const detail = $("#addrDetail").value.trim();
    const isDefault = $("#addrDefault").checked;

    if (!name) { showToast("请填写收货人姓名", "error"); return; }
    if (!/^1\d{10}$/.test(phone)) { showToast("请填写正确的手机号", "error"); return; }
    if (!detail) { showToast("请填写详细地址", "error"); return; }

    const list = DB.getAddresses();
    const newAddr = { id: Date.now().toString(), name, phone, province, city, detail, isDefault };
    if (isDefault) list.forEach(a => a.isDefault = false);
    list.push(newAddr);
    DB.saveAddresses(list);
    showToast("地址已保存 ✓", "success");
    closeModal();
    renderCheckout();
  });
}

// ===== 页面：支付 =====
function renderPayment({ orderId }) {
  const main = $("#app-view");
  const order = DB.getOrder(orderId);
  if (!order) {
    main.innerHTML = `<div class="container" style="text-align:center; padding:80px 24px;"><p>订单不存在或已过期</p><a href="#/" class="btn btn-primary" style="margin-top:16px; display:inline-block;">返回首页</a></div>`;
    return;
  }
  if (order.status !== "pending") {
    // 已支付或其他状态
    if (order.status === "paid" || order.status === "completed") {
      renderPaymentSuccess(order);
      return;
    }
  }

  const methods = [
    { key: "wechat", name: "微信支付", desc: "推荐，安全便捷", icon: "💬", iconClass: "wechat" },
    { key: "alipay", name: "支付宝", desc: "亿万用户的选择", icon: "💙", iconClass: "alipay" },
    { key: "bank", name: "银行卡支付", desc: "支持主流银行卡", icon: "💳", iconClass: "bank" }
  ];

  main.innerHTML = `
    <div class="container">
      <div class="payment-page">
        <div class="payment-header">
          <div class="amount-label">需支付</div>
          <div class="amount">${formatPrice(order.total)}</div>
          <div style="font-size:13px; color: var(--text-light); margin-top: 6px;">订单号：${order.id}</div>
        </div>

        <div class="payment-methods" id="paymentMethods">
          ${methods.map((m, i) => `
            <div class="payment-method ${i === 0 ? "selected" : ""}" data-method="${m.key}">
              <div class="payment-icon ${m.iconClass}">${m.icon}</div>
              <div class="payment-info">
                <div class="name">${m.name}</div>
                <div class="desc">${m.desc}</div>
              </div>
              <div class="payment-check"></div>
            </div>
          `).join("")}
        </div>

        <button class="btn btn-primary btn-lg btn-block" id="confirmPayBtn">确认支付 ¥${formatPrice(order.total)}</button>

        <div style="text-align:center; margin-top: 24px; font-size: 12px; color: var(--text-lighter);">
          支付即表示同意《萌宠之家购买协议》<br>
          安全支付 · 信息加密
        </div>
      </div>
    </div>
  `;

  let selectedMethod = "wechat";
  $$(".payment-method").forEach(m => {
    m.addEventListener("click", () => {
      $$(".payment-method").forEach(x => x.classList.remove("selected"));
      m.classList.add("selected");
      selectedMethod = m.dataset.method;
    });
  });

  $("#confirmPayBtn").addEventListener("click", () => {
    openModal(`
      <div style="text-align:center; padding: 30px 10px;">
        <div style="font-size: 48px; margin-bottom: 12px;">💰</div>
        <h3 style="margin-bottom: 8px;">确认支付</h3>
        <p style="color: var(--text-light); font-size: 14px; margin-bottom: 16px;">
          使用 <strong>${methods.find(m => m.key === selectedMethod).name}</strong><br>
          支付 <strong style="color: var(--primary-dark); font-size: 20px;">¥${formatPrice(order.total)}</strong>
        </p>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="cancelPayBtn" style="flex:1;">取消</button>
          <button class="btn btn-primary" id="doPayBtn" style="flex:1;">确认支付</button>
        </div>
      </div>
    `);
    $("#cancelPayBtn").addEventListener("click", closeModal);
    $("#doPayBtn").addEventListener("click", () => {
      closeModal();
      doPayment(order, selectedMethod);
    });
  });
}

function doPayment(order, method) {
  openModal(`
    <div style="text-align:center; padding: 40px 10px;">
      <div class="payment-spinner" style="margin: 0 auto 20px; width: 56px; height: 56px; border-width: 3px;"></div>
      <p style="color: var(--text-light); font-size: 14px;">正在处理支付，请稍候...</p>
    </div>
  `);

  setTimeout(() => {
    DB.updateOrderStatus(order.id, "paid");
    const allOrders = DB.getOrders();
    const o = allOrders.find(x => x.id === order.id);
    if (o) { o.paymentMethod = method; DB.saveOrders(allOrders); }
    closeModal();
    showToast("支付成功！🐾", "success");
    setTimeout(() => renderPaymentSuccess(DB.getOrder(order.id)), 600);
  }, 2000);
}

function renderPaymentSuccess(order) {
  const main = $("#app-view");
  main.innerHTML = `
    <div class="container">
      <div class="payment-page">
        <div class="payment-success">
          <div class="payment-success-icon">🎉</div>
          <h2>支付成功！</h2>
          <p style="color: var(--text-light); margin: 8px 0 24px;">恭喜！您的萌宠正在安排发货 🐾</p>
          <div style="background: var(--bg-soft); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
              <span style="color: var(--text-light);">订单号</span>
              <span>${order.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
              <span style="color: var(--text-light);">支付金额</span>
              <span style="color: var(--primary-dark); font-weight: 600;">¥${formatPrice(order.total)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
              <span style="color: var(--text-light);">收货地址</span>
              <span style="text-align: right; max-width: 60%;">${order.address.province}${order.address.city}${order.address.detail}</span>
            </div>
          </div>
          <div style="display: flex; gap: 12px;">
            <a href="#/orders" class="btn btn-secondary" style="flex: 1;">查看订单</a>
            <a href="#/" class="btn btn-primary" style="flex: 1;">继续逛</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== 页面：订单 =====
let ordersTab = "all";

function renderOrders() {
  const main = $("#app-view");
  const user = DB.getCurrentUser();
  if (!user) {
    location.hash = "#/login";
    return;
  }

  let orders = DB.getOrders();
  if (ordersTab !== "all") {
    orders = orders.filter(o => o.status === ordersTab);
  }

  const tabs = [
    { key: "all", name: "全部" },
    { key: "pending", name: "待支付" },
    { key: "paid", name: "已支付" },
    { key: "completed", name: "已完成" },
    { key: "cancelled", name: "已取消" }
  ];

  main.innerHTML = `
    <div class="container">
      <div class="orders-page">
        <h1 style="margin-bottom: 20px;">我的订单</h1>
        <div class="orders-header">
          ${tabs.map(t => `<button class="list-tab ${t.key === ordersTab ? "active" : ""}" data-tab="${t.key}">${t.name}</button>`).join("")}
        </div>

        ${orders.length ? `
          ${orders.map(o => `
            <div class="order-card">
              <div class="order-top">
                <span class="order-no">订单号：${o.id}</span>
                <span class="order-status ${o.status}">${statusText(o.status)}</span>
              </div>
              ${o.items.map(it => `
                <div class="order-item">
                  <div class="cart-thumb"><img src="${it.image}" onerror="this.src='${petImgFallback(o.items[0].productId || it.name)}'"></div>
                  <div class="order-item-info">
                    <div class="name">${it.name}</div>
                    <div class="meta">${it.selectedSize} × ${it.quantity}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: 500;">¥${formatPrice(it.price * it.quantity)}</div>
                  </div>
                </div>
              `).join("")}
              <div class="order-bottom">
                <div>
                  <div class="order-total">共 ${o.items.reduce((s, x) => s + x.quantity, 0)} 只，合计<strong>¥${formatPrice(o.total)}</strong></div>
                  <div class="order-time">${formatDate(o.createTime)}</div>
                </div>
                <div class="order-actions">
                  ${renderOrderActions(o)}
                </div>
              </div>
            </div>
          `).join("")}
        ` : `
          <div style="text-align: center; padding: 80px 24px; color: var(--text-light);">
            <div style="font-size: 60px; margin-bottom: 16px;">📦</div>
            <p>暂无相关订单</p>
            <a href="#/" class="btn btn-primary" style="margin-top: 16px; display:inline-block;">去逛逛 →</a>
          </div>
        `}
      </div>
    </div>
  `;

  $$(".list-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      ordersTab = tab.dataset.tab;
      renderOrders();
    });
  });

  $$(".order-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const orderId = btn.dataset.orderId;
      if (action === "pay") {
        location.hash = `#/payment/${orderId}`;
      } else if (action === "complete") {
        DB.updateOrderStatus(orderId, "completed");
        showToast("已确认收货 🎉", "success");
        renderOrders();
      } else if (action === "cancel") {
        openModal(`
          <div style="text-align:center; padding: 20px 10px;">
            <h3 style="margin-bottom: 8px;">确认取消订单？</h3>
            <p style="color: var(--text-light); font-size: 14px; margin-bottom: 20px;">取消后无法恢复</p>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" id="cancelOrderNo" style="flex:1;">再想想</button>
              <button class="btn btn-primary" id="cancelOrderYes" style="flex:1; background: var(--danger); border-color: var(--danger);">确认取消</button>
            </div>
          </div>
        `);
        $("#cancelOrderNo").addEventListener("click", closeModal);
        $("#cancelOrderYes").addEventListener("click", () => {
          DB.updateOrderStatus(orderId, "cancelled");
          closeModal();
          showToast("订单已取消", "info");
          renderOrders();
        });
      }
    });
  });
}

function statusText(s) {
  return { pending: "待支付", paid: "已支付", completed: "已完成", cancelled: "已取消" }[s] || s;
}

function renderOrderActions(o) {
  if (o.status === "pending") {
    return `
      <button class="btn btn-secondary btn-sm order-action-btn" data-action="cancel" data-order-id="${o.id}">取消订单</button>
      <button class="btn btn-primary btn-sm order-action-btn" data-action="pay" data-order-id="${o.id}">去支付</button>
    `;
  }
  if (o.status === "paid") {
    return `<button class="btn btn-primary btn-sm order-action-btn" data-action="complete" data-order-id="${o.id}">确认收货</button>`;
  }
  if (o.status === "completed") {
    return `<button class="btn btn-ghost btn-sm">再次购买</button>`;
  }
  return "";
}

// ===== 页面：联系我们 =====
function renderContact() {
  const main = $("#app-view");
  main.innerHTML = `
    <div class="container">
      <div class="contact-page">
        <div class="contact-hero">
          <div style="font-size: 64px; margin-bottom: 12px;">🐾</div>
          <h1>联系萌宠之家</h1>
          <p>有任何问题，欢迎随时联系我们~</p>
          <div class="contact-email-big">📧 service@mengchongjia.com</div>
          <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-primary" id="copyEmailBtn">复制邮箱</button>
            <a href="mailto:service@mengchongjia.com" class="btn btn-secondary">📬 发送邮件</a>
          </div>
        </div>

        <div class="contact-info-grid">
          <div class="contact-info-card">
            <div class="icon">💼</div>
            <h4>工作时间</h4>
            <p>周一至周日 9:00 - 21:00</p>
          </div>
          <div class="contact-info-card">
            <div class="icon">📞</div>
            <h4>客服电话</h4>
            <p>400-888-6688</p>
          </div>
          <div class="contact-info-card">
            <div class="icon">📍</div>
            <h4>公司地址</h4>
            <p>上海市静安区南京西路 1000 号</p>
          </div>
        </div>
      </div>
    </div>
  `;

  $("#copyEmailBtn").addEventListener("click", () => {
    navigator.clipboard.writeText("service@mengchongjia.com").then(
      () => showToast("邮箱已复制 ✓", "success"),
      () => showToast("复制失败，请手动复制", "error")
    );
  });
}

// ===== 404 =====
function renderNotFound() {
  $("#app-view").innerHTML = `
    <div class="container" style="text-align:center; padding:100px 24px;">
      <div style="font-size: 80px; margin-bottom: 16px;">🐾</div>
      <h2 style="margin-bottom: 8px;">哎呀，走丢了~</h2>
      <p style="color: var(--text-light); margin-bottom: 24px;">这里没有找到任何萌宠</p>
      <a href="#/" class="btn btn-primary">返回首页</a>
    </div>
  `;
}

// ===== 退出登录 =====
function initGlobalEvents() {
  // 退出登录
  document.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn") {
      e.preventDefault();
      DB.setCurrentUser(null);
      updateAllStatus();
      showToast("已退出登录", "info");
      location.hash = "#/";
    }
  });

  // 汉堡菜单
  const hamburger = $("#hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      let panel = document.getElementById("mobileNavPanel");
      if (!panel) {
        panel = document.createElement("div");
        panel.id = "mobileNavPanel";
        panel.className = "mobile-nav-panel";
        panel.innerHTML = `
          <a href="#/" class="nav-link">🏠 首页</a>
          <a href="#/category/cat">🐱 猫咪</a>
          <a href="#/category/dog">🐶 狗狗</a>
          <a href="#/category/small">🐰 小宠</a>
          <a href="#/category/fish">🐠 水族</a>
          <a href="#/cart">🛒 购物车</a>
          <a href="#/orders">📦 我的订单</a>
          <a href="#/contact">✉️ 联系我们</a>
        `;
        document.body.appendChild(panel);
        panel.querySelectorAll("a").forEach(a => {
          a.addEventListener("click", () => {
            hamburger.classList.remove("active");
            panel.classList.remove("open");
          });
        });
      }
      panel.classList.toggle("open");
    });
  }

  // 关闭欢迎弹窗
  $("#welcomeClose").addEventListener("click", () => {
    $("#welcomeModal").classList.add("hidden");
    localStorage.setItem("mc_welcome_shown", "1");
  });
  $("#welcomeRegisterBtn").addEventListener("click", () => {
    $("#welcomeModal").classList.add("hidden");
    localStorage.setItem("mc_welcome_shown", "1");
  });

  // 搜索
  const searchInput = $("#searchInput");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && searchInput.value.trim()) {
        showToast("搜索功能开发中~", "info");
      }
    });
  }
}

// ===== 新用户弹窗 =====
function maybeShowWelcomeModal() {
  if (localStorage.getItem("mc_welcome_shown") === "1") return;
  const user = DB.getCurrentUser();
  if (user) { localStorage.setItem("mc_welcome_shown", "1"); return; }
  setTimeout(() => {
    $("#welcomeModal").classList.remove("hidden");
  }, 1500);
}

// ===== 启动 =====
document.addEventListener("DOMContentLoaded", () => {
  // 注册路由
  Router.addRoute("", renderHome);
  Router.addRoute("/", renderHome);
  Router.addRoute("category/:cat", renderCategory);
  Router.addRoute("product/:id", renderProduct);
  Router.addRoute("login", renderLogin);
  Router.addRoute("cart", renderCart);
  Router.addRoute("checkout", renderCheckout);
  Router.addRoute("payment/:orderId", renderPayment);
  Router.addRoute("orders", renderOrders);
  Router.addRoute("contact", renderContact);

  // 初始化
  initGlobalEvents();
  updateAllStatus();
  Router.init();
  maybeShowWelcomeModal();

  // 跨页面购物车选中状态重置
  window.addEventListener("hashchange", () => {
    // 如果从结算/支付出来，清空选中状态
    const h = location.hash;
    if (!h.startsWith("#/cart")) {
      // 不强制清空，保留状态
    }
  });
});
