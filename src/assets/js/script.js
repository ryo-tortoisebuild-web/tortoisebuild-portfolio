// ============================================================
// AOS 初期化（AOS が読み込まれているページのみ）
// ============================================================
if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 800,
    once: true,
  });
}

// ============================================================
// FV アニメーション
// Phase1: 散らばり（初期）
// Phase2: ラベル下移動（0.5s後）
// Phase3: キーワード集合（+1000ms）
// Phase4: 黒版FI（+3280ms）
// Phase5: オレンジ切替・ラベル/ワード消去（+4080ms）
// Phase6: SCROLL表示（+5280ms）
// ============================================================
(function fvAnimation() {
  var fvEl = document.querySelector(".fv");
  var labelEl = document.querySelector(".fv__label");
  var wordEls = Array.from(document.querySelectorAll(".fv__word"));
  var treeBlack = document.querySelector(".fv__tree-black");
  var treeOrange = document.querySelector(".fv__tree-orange");
  var scrollEl = document.querySelector(".fv__scroll");
  var copyEl = document.querySelector(".fv__copy");

  if (!fvEl || wordEls.length === 0 || !treeBlack || !treeOrange) return;

  // 散らばり初期位置（.fv の幅・高さに対する比率）
  var INIT_POS = [
    { top: 0.1, left: 0.2 }, // 強み
    { top: 0.05, left: 0.65 }, // 空き状況
    { top: 0.25, left: 0.8 }, // シーン
    { top: 0.5, left: 0.75 }, // 商品
    { top: 0.7, left: 0.65 }, // 安心
    { top: 0.7, left: 0.25 }, // 口コミ
    { top: 0.5, left: 0.15 }, // 予約
  ];

  // 最終位置（下部に集合）の top 比率（left は CSS で 50% 固定）
  // CSS の nth-child top 値と一致させること
  var FINAL_TOP = [0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7];

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // モーション縮小：最終状態を即時表示してアニメーションをスキップ
  if (prefersReducedMotion) {
    treeBlack.style.opacity = "0";
    treeOrange.style.opacity = "1";
    wordEls.forEach(function (w) {
      w.style.opacity = "0";
    });
    if (labelEl) labelEl.style.opacity = "0";
    if (copyEl) copyEl.style.opacity = "1";
    if (scrollEl) scrollEl.style.opacity = "1";
    return;
  }

  // フェーズ1：初期状態をセット（トランジションなし）
  // ラベルは AOS が処理するため触れない
  function applyInitialState() {
    var rect = fvEl.getBoundingClientRect();
    var W = rect.width || 1088;
    var H = rect.height || 991;

    wordEls.forEach(function (w, i) {
      var tx = (INIT_POS[i].left - 0.5) * W;
      var ty = (INIT_POS[i].top - FINAL_TOP[i]) * H;
      w.style.transition = "none";
      w.style.setProperty("--tx", tx + "px");
      w.style.setProperty("--ty", ty + "px");
      w.style.opacity = "0.4";
    });

    treeBlack.style.opacity = "0";
    treeOrange.style.opacity = "0";
    if (scrollEl) scrollEl.style.opacity = "0";

    if (copyEl) {
      if (window.innerWidth >= 1280) {
        // PCのみ即時フェードイン
        copyEl.style.transition = "opacity 0.8s ease-out";
        copyEl.style.opacity = "1";
      } else {
        // Tab・SP: Phase6でフェードイン
        copyEl.style.opacity = "0";
      }
    }
  }

  // フェーズ2：ラベルをキーワード群の下へ移動
  // PC（1280px以上）は77%、Tab・SPは55%付近に移動
  function runPhase2() {
    if (!labelEl) return;
    var fvRect = fvEl.getBoundingClientRect();
    var H = fvRect.height || 991;
    var labelRect = labelEl.getBoundingClientRect();
    var labelCurTop = labelRect.top - fvRect.top;

    // PC（1280px以上）は77%、Tab・SPは55%付近に移動
    var targetRatio = window.innerWidth >= 1280 ? 0.77 : 0.55;
    var targetTop = H * targetRatio;
    var targetY = targetTop - labelCurTop;

    labelEl.style.transition = "transform 2.0s ease-out";
    void labelEl.offsetHeight;
    labelEl.style.transform = "translateX(-50%) translateY(" + targetY + "px)";
  }

  // フェーズ3：キーワードを下部に集合（1個ずつ 80ms ずらして）
  function runPhase3() {
    wordEls.forEach(function (w, i) {
      setTimeout(function () {
        w.style.transition = "transform 2.0s ease-out, opacity 1.2s ease-out";
        void w.offsetHeight; // reflow
        w.style.setProperty("--tx", "0px");
        w.style.setProperty("--ty", "0px");
        w.style.opacity = "1";
      }, i * 100);
    });
  }

  // フェーズ4：黒版フェードイン（0.8s）
  function runPhase4() {
    treeBlack.style.transition = "opacity 1.6s ease-out";
    treeBlack.style.opacity = "1";
  }

  // フェーズ5：オレンジ版切替・ラベル/ワード消去
  function runPhase5() {
    treeBlack.style.transition = "opacity 2.4s ease-out";
    treeBlack.style.opacity = "0";
    treeOrange.style.transition = "opacity 2.4s ease-out";
    treeOrange.style.opacity = "1";

    wordEls.forEach(function (w) {
      w.style.transition = "opacity 0.8s ease-out";
      w.style.opacity = "0";
    });

    if (labelEl) {
      labelEl.style.transition = "opacity 0.8s ease-out";
      labelEl.style.opacity = "0";
    }
  }

  // フェーズ6：キャッチコピー＋SCROLLインジケーター表示
  function runPhase6() {
    // Tab・SP・PCすべてでキャッチコピーをフェードイン
    // （PCは既にapplyInitialStateで表示済みだが上書きしても問題なし）
    if (copyEl && window.innerWidth < 1280) {
      copyEl.style.transition = "opacity 0.8s ease-out";
      copyEl.style.opacity = "1";
    }
    if (scrollEl) {
      scrollEl.style.transition = "opacity 0.8s ease-out";
      scrollEl.style.opacity = "1";
    }
  }

  // タイミング（Phase2 基点からのオフセット ms）
  // Phase2:  0ms（ラベル移動開始）
  // Phase3:  1000ms（ラベル移動完了）
  // 最終ワード集合完了: 1000 + (6 * 100) + 1000 = 2600ms
  // Phase4:  2600 + 800 = 3400ms
  // Phase5:  3400 + 800 = 4200ms
  // Phase6:  4200 + 1200 = 5400ms
  function runAnimation() {
    runPhase2();
    setTimeout(runPhase3, 1000);
    setTimeout(runPhase4, 3400);
    setTimeout(runPhase5, 4200);
    setTimeout(runPhase6, 5400);
  }

  // DOMContentLoaded後に初期状態をセット（リロード時のちらつき防止）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyInitialState);
  } else {
    applyInitialState();
  }

  // IntersectionObserver で .fv が表示されたら 0.5s 後に発火
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setTimeout(runAnimation, 500);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.1 },
  );

  observer.observe(fvEl);
})();

// ============================================================
// ハンバーガーメニュー
// ============================================================
const hamburgerBtn = document.getElementById("hamburger-btn");
const headerNav = document.getElementById("header-nav");

if (hamburgerBtn && headerNav) {
  hamburgerBtn.addEventListener("click", () => {
    const isExpanded = hamburgerBtn.getAttribute("aria-expanded") === "true";

    // aria-expanded を切り替え
    hamburgerBtn.setAttribute("aria-expanded", String(!isExpanded));

    // nav の開閉クラスを切り替え
    headerNav.classList.toggle("is-open");

    // body のスクロール制御
    document.body.classList.toggle("is-drawer-open", !isExpanded);

    // aria-label を切り替え
    hamburgerBtn.setAttribute("aria-label", isExpanded ? "メニューを開く" : "メニューを閉じる");
  });

  // ナビリンクをクリックしたらメニューを閉じる
  const navLinks = headerNav.querySelectorAll(".header__nav-link, .header__cta-btn");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      hamburgerBtn.setAttribute("aria-expanded", "false");
      headerNav.classList.remove("is-open");
      hamburgerBtn.setAttribute("aria-label", "メニューを開く");
      document.body.classList.remove("is-drawer-open");
    });
  });
}

// ============================================================
// TOPへ戻るボタン
// スクロール量が画面高さの80%を超えたらフェードイン
// ============================================================
(function () {
  var btn = document.getElementById("back-to-top");
  if (!btn) return;

  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset;
    var threshold = 500;
    if (scrollY > threshold) {
      btn.classList.add("is-visible");
    } else {
      btn.classList.remove("is-visible");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ========== コンタクトフォームバリデーション ==========
const contactForm = document.querySelector(".contact-page__form");
if (contactForm) {
  // エラー表示関数
  function showError(input, message) {
    input.style.borderColor = "#fc5c1f";
    let errorEl = input.parentElement.querySelector(".js-error");
    if (!errorEl) {
      errorEl = document.createElement("p");
      errorEl.className = "js-error";
      errorEl.style.cssText = "color:#fc5c1f; font-size:12px; margin-top:6px;";
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  // エラーリセット関数
  function clearError(input) {
    input.style.borderColor = "";
    const errorEl = input.parentElement.querySelector(".js-error");
    if (errorEl) errorEl.remove();
  }

  // 入力時にリアルタイムでエラー解除
  contactForm.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("input", () => clearError(el));
    el.addEventListener("change", () => clearError(el));
  });

  // 送信前バリデーション
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    let hasError = false;

    const name = document.getElementById("name");
    const kana = document.getElementById("kana");
    const email = document.getElementById("email");
    const category = document.getElementById("category");
    const privacy = document.getElementById("privacy");

    // リセット
    [name, kana, email, category].forEach((el) => clearError(el));
    const privacyError = privacy.parentElement.querySelector(".js-error");
    if (privacyError) privacyError.remove();

    // 各項目チェック
    if (!name.value.trim()) {
      showError(name, "お名前を入力してください");
      hasError = true;
    }
    if (!kana.value.trim()) {
      showError(kana, "フリガナを入力してください");
      hasError = true;
    }
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showError(email, "正しいメールアドレスを入力してください");
      hasError = true;
    }
    if (!category.value) {
      showError(category, "お問い合わせ項目を選択してください");
      hasError = true;
    }
    if (!privacy.checked) {
      const errorEl = document.createElement("p");
      errorEl.className = "js-error";
      errorEl.style.cssText = "color:#fc5c1f; font-size:12px; margin-top:6px;";
      errorEl.textContent = "プライバシーポリシーへの同意が必要です";
      privacy.parentElement.appendChild(errorEl);
      hasError = true;
    }

    // 変更後
    if (!hasError) {
      grecaptcha.ready(function () {
        grecaptcha
          .execute("6LfmgbAsAAAAAL5UbiEvP13ofJqLlq6-WaTOxxgh", { action: "contact" })
          .then(function (token) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "recaptcha_token";
            input.value = token;
            contactForm.appendChild(input);
            contactForm.submit();
          });
      });
    }
  });
}
