/* ================================================================
 * 式と展開 ビジュアル学習アプリ
 * ① 面積モデル  / ② 公式ビジュアライザー / ③ 構造把握(塊)
 * ================================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";

const COLOR = {
    x2: "#8b5cf6",
    x:  "#10b981",
    c:  "#f59e0b",
    neg:"#ef4444",
    chunk: "#ec4899",
};

/* -------- 便利ユーティリティ -------- */
const el = (tag, attrs = {}, parent = null) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
};

const signed = (n) => (n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`);
const signedTerm = (n, v) => {
    if (n === 0) return "";
    const abs = Math.abs(n);
    const sign = n >= 0 ? "+" : "−";
    const coef = abs === 1 && v ? "" : abs;
    return `${sign} ${coef}${v}`;
};
const mathNumber = (n) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);
const wrapSigned = (n) => (n < 0 ? `(${mathNumber(n)})` : `${n}`);
const formatLinearFactor = (variable, n) => (n === 0 ? `(${variable})` : `(${variable} ${signed(n)})`);
const termVariable = (power) => (power === 0 ? "" : power === 1 ? "x" : "x²");
const termTypeLabel = (power) => (power === 2 ? "2次の項" : power === 1 ? "1次の項" : "定数項");

function formatTerm(coef, power, { first = false } = {}) {
    if (coef === 0) return first ? "0" : "";
    const sign = coef >= 0 ? (first ? "" : " + ") : (first ? "−" : " − ");
    const abs = Math.abs(coef);
    const coefText = power > 0 && abs === 1 ? "" : `${abs}`;
    return `${sign}${coefText}${termVariable(power)}`;
}

function formatOrderedTerms(termList) {
    const nonZero = termList.filter((t) => t.c !== 0);
    if (nonZero.length === 0) return "0";
    return nonZero.map((t, i) => formatTerm(t.c, t.p, { first: i === 0 })).join("");
}

function formatColoredPolynomial(termList) {
    const nonZero = termList.filter((t) => t.c !== 0);
    if (nonZero.length === 0) return "0";

    return nonZero.map((t, i) => {
        const sign = t.c >= 0
            ? (i === 0 ? "" : '<span class="op">+</span> ')
            : '<span class="op">−</span> ';
        const abs = Math.abs(t.c);
        const coef = t.p > 0 && abs === 1 ? "" : `${abs}`;
        const klass = t.p === 2 ? "hl-x2" : t.p === 1 ? "hl-x" : "hl-c";
        return `${sign}<span class="${klass}">${coef}${termVariable(t.p)}</span>`;
    }).join(" ");
}

/* ================================================================
 * ナビゲーション
 * ================================================================ */
document.addEventListener("DOMContentLoaded", () => {
    const navBtns = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".mode-section");

    navBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            navBtns.forEach((b) => b.classList.remove("active"));
            sections.forEach((s) => s.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`${btn.dataset.mode}-mode`).classList.add("active");
        });
    });

    initAreaMode();
    initFormulaMode();
    initChunkMode();
    initQuizMode();
});

/* ================================================================
 * ① 面積モデル  (x+a)(x+b)  ※ 負の数にも対応
 * ================================================================ */
function initAreaMode() {
    const input = document.getElementById("expression-input");
    const btn = document.getElementById("generate-btn");
    const container = document.getElementById("svg-container");

    const run = () => generateAreaModel(input.value, container);
    btn.addEventListener("click", run);
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") run(); });

    document.querySelectorAll(".preset-btn").forEach((p) => {
        p.addEventListener("click", () => {
            input.value = p.dataset.expr;
            run();
        });
    });

    run(); // 初期描画
}

function parseAreaExpr(expr) {
    // (x ± a)(x ± b) を受理
    const s = expr.replace(/\s+/g, "");
    const m = s.match(/^\(x([+-]\d+)?\)\(x([+-]\d+)?\)$/i);
    if (!m) return null;
    return {
        a: m[1] ? parseInt(m[1], 10) : 0,
        b: m[2] ? parseInt(m[2], 10) : 0,
    };
}

function generateAreaModel(expr, container) {
    container.innerHTML = "";
    const oldResult = container.parentNode.querySelector(".result-div");
    if (oldResult) oldResult.remove();
    const guide = document.getElementById("area-guide");
    const products = document.getElementById("area-products");
    const steps = document.getElementById("area-steps");

    const parsed = parseAreaExpr(expr);
    if (!parsed) {
        container.innerHTML =
            '<p style="color:var(--color-const); font-size:1.1rem; text-align:center;">' +
            "数式が正しくありません。<br>例: (x+3)(x+4), (x-2)(x+5)</p>";
        guide.innerHTML =
            `<h3>入力のしかた</h3>
             <p><code>(x+3)(x+4)</code> のように、2つのかっこを続けて入力します。</p>
             <div class="legend-row">
                <span class="legend-chip"><span class="legend-dot x2"></span>x² の図</span>
                <span class="legend-chip"><span class="legend-dot x"></span>x の項</span>
                <span class="legend-chip"><span class="legend-dot c"></span>定数項</span>
             </div>`;
        products.innerHTML =
            `<h3>このモードで学べること</h3>
             <p>展開をいきなり暗記せず、<strong>4つの積</strong>と<strong>同類項の整理</strong>で答えを作る流れを確認できます。</p>`;
        steps.innerHTML =
            `<h3>手順のイメージ</h3>
             <div class="math-steps">
                <div class="math-step"><span class="step-number">1</span><div><div class="math-line">4つの長方形に分ける</div><div class="math-caption">全体の面積は、部分の面積の和です。</div></div></div>
                <div class="math-step"><span class="step-number">2</span><div><div class="math-line">x², ax, bx, ab を読む</div><div class="math-caption">1つずつ「たて × よこ」で考えます。</div></div></div>
                <div class="math-step"><span class="step-number">3</span><div><div class="math-line">ax と bx をまとめる</div><div class="math-caption">どちらも x の項なので、係数だけ足します。</div></div></div>
             </div>`;
        return;
    }

    const { a, b } = parsed;
    const aAbs = Math.abs(a);
    const bAbs = Math.abs(b);

    // サイズ計算
    const baseSize = 220;
    const scale = 22;
    const wA = Math.max(aAbs * scale, 45);
    const hB = Math.max(bAbs * scale, 45);
    const W = baseSize + wA;
    const H = baseSize + hB;
    const PAD = 70;

    const svg = el("svg", {
        width: "100%", height: "100%",
        viewBox: `0 0 ${W + PAD * 2} ${H + PAD * 2}`,
        preserveAspectRatio: "xMidYMid meet",
    });
    const g = el("g", { transform: `translate(${PAD}, ${PAD})` }, svg);

    // ブロック4つ
    const blocks = [
        { key: "xx", x: 0, y: 0, w: baseSize, h: baseSize, fill: COLOR.x2, text: "x²", fs: 30, neg: false },
        { key: "xa", x: baseSize, y: 0, w: wA, h: baseSize, fill: COLOR.x, text: `${aAbs}x`, fs: 22, neg: a < 0 },
        { key: "bx", x: 0, y: baseSize, w: baseSize, h: hB, fill: COLOR.x, text: `${bAbs}x`, fs: 22, neg: b < 0 },
        { key: "ab", x: baseSize, y: baseSize, w: wA, h: hB, fill: COLOR.c, text: `${aAbs * bAbs}`, fs: 20, neg: (a * b) < 0 },
    ];

    const toggleRow = (key, active) => {
        const row = products.querySelector(`[data-key="${key}"]`);
        if (row) row.classList.toggle("active", active);
    };

    blocks.forEach((blk, i) => {
        const rect = el("rect", {
            x: blk.x + blk.w / 2, y: blk.y + blk.h / 2,
            width: 0, height: 0,
            fill: blk.fill,
            "fill-opacity": blk.neg ? 0.35 : 0.95,
            class: "area-rect" + (blk.neg ? " negative" : ""),
            "data-key": blk.key,
            rx: 8,
        }, g);

        setTimeout(() => {
            rect.setAttribute("x", blk.x + 2);
            rect.setAttribute("y", blk.y + 2);
            rect.setAttribute("width", blk.w - 4);
            rect.setAttribute("height", blk.h - 4);
        }, 60 * i);

        const signedText = blk.neg ? `−${blk.text}` : blk.text;
        const t = el("text", {
            x: blk.x + blk.w / 2, y: blk.y + blk.h / 2,
            class: "area-text", "font-size": blk.fs,
        }, g);
        t.textContent = signedText;

        rect.addEventListener("mouseenter", () => toggleRow(blk.key, true));
        rect.addEventListener("mouseleave", () => toggleRow(blk.key, false));
    });

    // ラベル
    const labels = [
        { x: baseSize / 2, y: -24, text: "x" },
        { x: baseSize + wA / 2, y: -24, text: a < 0 ? `−${aAbs}` : `${aAbs}` },
        { x: -24, y: baseSize / 2, text: "x" },
        { x: -24, y: baseSize + hB / 2, text: b < 0 ? `−${bAbs}` : `${bAbs}` },
    ];
    labels.forEach((l) => {
        const t = el("text", { x: l.x, y: l.y, class: "label-text", "font-size": 22 }, g);
        t.textContent = l.text;
    });

    // 外枠の括弧
    el("path", {
        d: `M 0 -44 L 0 -52 L ${W} -52 L ${W} -44 M -44 0 L -52 0 L -52 ${H} L -44 ${H}`,
        stroke: "rgba(255,255,255,0.35)", "stroke-width": 2, fill: "none",
    }, g);

    // 外側の和ラベル
    const top = el("text", { x: W / 2, y: -62, class: "label-text", "font-size": 20 }, g);
    top.textContent = `x ${signed(a)}`;
    const left = el("text", {
        x: -62, y: H / 2, class: "label-text", "font-size": 20,
        transform: `rotate(-90, -62, ${H / 2})`,
    }, g);
    left.textContent = `x ${signed(b)}`;

    container.appendChild(svg);
    guide.innerHTML = buildAreaGuide(a, b);
    products.innerHTML = buildAreaProducts(a, b);
    steps.innerHTML = buildAreaSteps(a, b);

    // 結果式
    const resultDiv = document.createElement("div");
    resultDiv.className = "result-div";
    const sum = a + b;
    const prod = a * b;
    resultDiv.innerHTML =
        `<span>(x ${signed(a)})(x ${signed(b)}) = </span>` +
        formatColoredPolynomial([
            { c: 1, p: 2 },
            { c: sum, p: 1 },
            { c: prod, p: 0 },
        ]);
    container.parentNode.appendChild(resultDiv);
}

function buildAreaGuide(a, b) {
    const needsNegativeHelp = a < 0 || b < 0;
    return `
        <h3>この図の読み方</h3>
        <p><strong>${formatLinearFactor("x", a)}${formatLinearFactor("x", b)}</strong> を、4つの長方形の面積として見ています。各部分の面積を足すと、展開した式になります。</p>
        <div class="legend-row">
            <span class="legend-chip"><span class="legend-dot x2"></span>x² の部分</span>
            <span class="legend-chip"><span class="legend-dot x"></span>x の項</span>
            <span class="legend-chip"><span class="legend-dot c"></span>定数項</span>
            ${needsNegativeHelp ? '<span class="legend-chip"><span class="legend-dot neg"></span>赤い点線は引く部分</span>' : ""}
        </div>
        <p class="formula-insight-line">${needsNegativeHelp
            ? "マイナスがあるときは、赤い点線の長方形を「足す」のではなく「引く」と読むのがポイントです。"
            : "緑の長方形が2つあるので、最後にそれらをまとめて真ん中の項を作ります。"}
        </p>
    `;
}

function buildAreaProducts(a, b) {
    const rows = [
        {
            key: "xx",
            accent: COLOR.x2,
            expression: `x × x = ${formatOrderedTerms([{ c: 1, p: 2 }])}`,
            caption: "紫の大きな正方形。ここが x² の項です。",
            negative: false,
        },
        {
            key: "xa",
            accent: COLOR.x,
            expression: `x × ${wrapSigned(a)} = ${formatOrderedTerms([{ c: a, p: 1 }])}`,
            caption: `右上の長方形。${termTypeLabel(1)}なので、あとでもう1つの x の項とまとめます。`,
            negative: a < 0,
        },
        {
            key: "bx",
            accent: COLOR.x,
            expression: `${wrapSigned(b)} × x = ${formatOrderedTerms([{ c: b, p: 1 }])}`,
            caption: `左下の長方形。こちらも ${termTypeLabel(1)} です。`,
            negative: b < 0,
        },
        {
            key: "ab",
            accent: COLOR.c,
            expression: `${wrapSigned(b)} × ${wrapSigned(a)} = ${formatOrderedTerms([{ c: a * b, p: 0 }])}`,
            caption: "右下の小さい長方形。x を含まないので定数項になります。",
            negative: a * b < 0,
        },
    ];

    return `
        <h3>4つの積と図の対応</h3>
        <p>マウスを図に乗せると、対応する式が光ります。</p>
        <div class="product-list">
            ${rows.map((row) => `
                <div class="product-row${row.negative ? " negative" : ""}" data-key="${row.key}" style="--row-accent:${row.accent}">
                    <div class="product-expression">${row.expression}</div>
                    <div class="product-caption">${row.caption}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function buildAreaSteps(a, b) {
    const sum = a + b;
    const product = a * b;
    const pieces = formatOrderedTerms([
        { c: 1, p: 2 },
        { c: a, p: 1 },
        { c: b, p: 1 },
        { c: product, p: 0 },
    ]);
    const xTerms = formatOrderedTerms([
        { c: a, p: 1 },
        { c: b, p: 1 },
    ]);
    const merged = formatOrderedTerms([{ c: sum, p: 1 }]);
    const result = formatOrderedTerms([
        { c: 1, p: 2 },
        { c: sum, p: 1 },
        { c: product, p: 0 },
    ]);

    return `
        <h3>式の変形を順番に見る</h3>
        <div class="math-steps">
            <div class="math-step" style="--row-accent:${COLOR.x2}">
                <span class="step-number">1</span>
                <div>
                    <div class="math-line">${formatLinearFactor("x", a)}${formatLinearFactor("x", b)}</div>
                    <div class="math-caption">まず、全体を 4 つの積に分けて考えます。</div>
                </div>
            </div>
            <div class="math-step" style="--row-accent:${COLOR.x}">
                <span class="step-number">2</span>
                <div>
                    <div class="math-line">= ${pieces}</div>
                    <div class="math-caption">図の 4 つの部分を順に読むと、x²・x の項・x の項・定数項が見えます。</div>
                </div>
            </div>
            <div class="math-step" style="--row-accent:${COLOR.x}">
                <span class="step-number">3</span>
                <div>
                    <div class="math-line">${xTerms} = ${merged}</div>
                    <div class="math-caption">真ん中の 2 つはどちらも x の項なので、係数 ${mathNumber(a)} と ${mathNumber(b)} を足します。</div>
                </div>
            </div>
            <div class="math-step" style="--row-accent:${COLOR.c}">
                <span class="step-number">4</span>
                <div>
                    <div class="math-line">= ${result}</div>
                    <div class="math-caption">同類項をまとめたら展開完了です。</div>
                </div>
            </div>
        </div>
    `;
}

/* ================================================================
 * ② 公式ビジュアライザー
 *   (a+b)², (a−b)², (a+b)(a−b)
 * ================================================================ */
function initFormulaMode() {
    const tabs = document.querySelectorAll(".formula-tab");
    const aInput = document.getElementById("param-a");
    const bInput = document.getElementById("param-b");
    const display = document.getElementById("formula-display");
    const insight = document.getElementById("formula-insight");
    const svgBox = document.getElementById("formula-svg-container");
    const steps = document.getElementById("formula-steps");

    let current = "sqPlus";

    const render = () => {
        const a = Math.max(1, Math.min(9, parseInt(aInput.value) || 1));
        const b = Math.max(1, Math.min(9, parseInt(bInput.value) || 1));
        renderFormula(current, a, b, { display, insight, svgBox, steps });
    };

    tabs.forEach((t) => {
        t.addEventListener("click", () => {
            tabs.forEach((x) => x.classList.remove("active"));
            t.classList.add("active");
            current = t.dataset.formula;
            render();
        });
    });

    aInput.addEventListener("input", render);
    bInput.addEventListener("input", render);

    render();
}

function renderFormula(kind, a, b, dom) {
    const { display, insight, svgBox, steps } = dom;
    svgBox.innerHTML = "";
    steps.innerHTML = "";

    if (kind === "sqPlus") {
        insight.innerHTML = `
            <h3>ここがポイント</h3>
            <p class="formula-insight-line"><span class="formula-key">ab の長方形が 2 枚</span>できるので、真ん中の項は <strong>2ab</strong> になります。</p>
            <div class="meta-chip-row">
                <span class="meta-chip">図で見る: a², ab, ab, b²</span>
                <span class="meta-chip">まとめる: ab + ab = 2ab</span>
            </div>
        `;
        display.innerHTML =
            `<span>(a + b)² = </span>` +
            `<span class="hl-x2">a²</span> + ` +
            `<span class="hl-x">2ab</span> + ` +
            `<span class="hl-c">b²</span>`;
        drawSquare(svgBox, a, b, "plus");
        addStep(steps, "図から読む", "a² と ab と ab と b² に分かれるので、<strong>a² + ab + ab + b²</strong>", COLOR.x2);
        addStep(steps, "同類項をまとめる", "ab が 2 つあるから、<strong>ab + ab = 2ab</strong>", COLOR.x, 1);
        addStep(steps, "公式", "(a + b)² = a² + 2ab + b²", COLOR.x2, 2);
        addStep(steps, `a = ${a}, b = ${b} を代入`,
            `(${a} + ${b})² = ${a}² + 2·${a}·${b} + ${b}²`, COLOR.x, 3);
        addStep(steps, "計算",
            `= ${a * a} + ${2 * a * b} + ${b * b} = <strong>${(a + b) ** 2}</strong>`, COLOR.c, 4);
    } else if (kind === "sqMinus") {
        insight.innerHTML = `
            <h3>ここがポイント</h3>
            <p class="formula-insight-line"><span class="formula-key">ab の帯を 2 回引く</span>ので <strong>−2ab</strong> になります。ただし右下の <strong>b²</strong> は引きすぎるので最後に 1 回足し戻します。</p>
            <div class="meta-chip-row">
                <span class="meta-chip">引く: ab と ab</span>
                <span class="meta-chip">足し戻す: b²</span>
            </div>
        `;
        display.innerHTML =
            `<span>(a − b)² = </span>` +
            `<span class="hl-x2">a²</span> − ` +
            `<span class="hl-x">2ab</span> + ` +
            `<span class="hl-c">b²</span>`;
        drawSquare(svgBox, a, b, "minus");
        addStep(steps, "図から読む", "a² から ab の帯を 2 つ引き、重なって引きすぎた b² を 1 回足し戻します。", COLOR.x2);
        addStep(steps, "同類項の見え方", "−ab − ab = <strong>−2ab</strong>", COLOR.x, 1);
        addStep(steps, "公式", "(a − b)² = a² − 2ab + b²", COLOR.x2, 2);
        addStep(steps, `a = ${a}, b = ${b} を代入`,
            `(${a} − ${b})² = ${a}² − 2·${a}·${b} + ${b}²`, COLOR.x, 3);
        addStep(steps, "計算",
            `= ${a * a} − ${2 * a * b} + ${b * b} = <strong>${(a - b) ** 2}</strong>`, COLOR.c, 4);
    } else if (kind === "diff") {
        insight.innerHTML = `
            <h3>ここがポイント</h3>
            <p class="formula-insight-line"><span class="formula-key">+ab と −ab が打ち消し合う</span>ので、真ん中の項が消えて <strong>a² − b²</strong> だけが残ります。</p>
            <div class="meta-chip-row">
                <span class="meta-chip">残る: a²</span>
                <span class="meta-chip">消える: +ab と −ab</span>
                <span class="meta-chip">残る: −b²</span>
            </div>
        `;
        display.innerHTML =
            `<span>(a + b)(a − b) = </span>` +
            `<span class="hl-x2">a²</span> − ` +
            `<span class="hl-c">b²</span>`;
        drawDiffOfSquares(svgBox, a, b);
        addStep(steps, "図から読む", "a², +ab, −ab, −b² の 4 つに分けると、真ん中の 2 つが消えます。", COLOR.x2);
        addStep(steps, "打ち消し合い", "+ab と −ab が 0 になるので、<strong>a² − b²</strong> が残ります。", COLOR.x, 1);
        addStep(steps, "公式", "(a + b)(a − b) = a² − b²", COLOR.x2, 2);
        addStep(steps, `a = ${a}, b = ${b} を代入`,
            `(${a} + ${b})(${a} − ${b}) = ${a}² − ${b}²`, COLOR.x, 3);
        addStep(steps, "計算",
            `= ${a * a} − ${b * b} = <strong>${a * a - b * b}</strong>`, COLOR.c, 4);
    }
}

function addStep(root, label, body, color = COLOR.x2, delay = 0) {
    const div = document.createElement("div");
    div.className = "step-item";
    div.style.borderLeftColor = color;
    div.style.animationDelay = `${0.15 + delay * 0.2}s`;
    div.innerHTML = `<span class="label">${label}</span>${body}`;
    root.appendChild(div);
}

/* ---- (a±b)² の正方形ビジュアル ---- */
function drawSquare(container, a, b, mode /* 'plus'|'minus' */) {
    const unit = 28;
    const side = (a + (mode === "plus" ? b : 0)) * unit;
    // 'minus' の場合は一辺が a の正方形から b を切り取って表現する
    const W = (mode === "plus" ? (a + b) : a) * unit;
    const H = W;
    const PAD = 60;
    const svg = el("svg", {
        viewBox: `0 0 ${W + PAD * 2} ${H + PAD * 2}`,
        width: "100%", height: "100%",
        preserveAspectRatio: "xMidYMid meet",
    });
    const g = el("g", { transform: `translate(${PAD}, ${PAD})` }, svg);

    if (mode === "plus") {
        // 4ブロック: a², ab, ab, b²
        const blocks = [
            { x: 0, y: 0, w: a * unit, h: a * unit, fill: COLOR.x2, label: "a²" },
            { x: a * unit, y: 0, w: b * unit, h: a * unit, fill: COLOR.x, label: "ab" },
            { x: 0, y: a * unit, w: a * unit, h: b * unit, fill: COLOR.x, label: "ab" },
            { x: a * unit, y: a * unit, w: b * unit, h: b * unit, fill: COLOR.c, label: "b²" },
        ];
        blocks.forEach((blk, i) => drawBlock(g, blk, i));

        // 辺ラベル
        labelEdge(g, a * unit / 2, -18, "a");
        labelEdge(g, a * unit + b * unit / 2, -18, "b");
        labelEdge(g, -18, a * unit / 2, "a");
        labelEdge(g, -18, a * unit + b * unit / 2, "b");
    } else {
        // (a-b)² : a×a の正方形から、幅b の帯を2つ引き、重複 b² を足す
        // 視覚：大きな a² (紫) の上に、右と下の帯 ab を薄い赤で重ね、右下の b² を strong highlight
        const A = a * unit;
        const B = b * unit;

        // ベース a²
        drawBlock(g, { x: 0, y: 0, w: A, h: A, fill: COLOR.x2, label: "a²" }, 0);
        // 右の帯 (ab) 引く
        drawBlock(g, { x: A - B, y: 0, w: B, h: A, fill: COLOR.neg, label: `−ab`, opacity: 0.55, dashed: true }, 1);
        // 下の帯 (ab) 引く
        drawBlock(g, { x: 0, y: A - B, w: A, h: B, fill: COLOR.neg, label: `−ab`, opacity: 0.55, dashed: true }, 2);
        // 重複部分 b² を足し戻す
        drawBlock(g, { x: A - B, y: A - B, w: B, h: B, fill: COLOR.c, label: "+b²" }, 3);

        labelEdge(g, A / 2, -18, "a");
        labelEdge(g, -18, A / 2, "a");
        labelEdge(g, A - B / 2, A + 22, "b", 14);
        labelEdge(g, A + 22, A - B / 2, "b", 14);
    }

    container.appendChild(svg);
}

/* ---- (a+b)(a-b) のビジュアル (長方形) ---- */
function drawDiffOfSquares(container, a, b) {
    if (a <= b) {
        // b>=a の場合の表示
        container.innerHTML =
            '<p style="color:var(--color-const); font-size:1rem; text-align:center;">' +
            "面積図として見るときは a &gt; b にしてください。計算の流れは下で確認できます。</p>";
        return;
    }
    const unit = 28;
    const A = a * unit;
    const B = b * unit;
    const W = A + B;
    const H = A + B;
    const PAD = 70;
    const svg = el("svg", {
        viewBox: `0 0 ${W + PAD * 2} ${H + PAD * 2 + 20}`,
        width: "100%", height: "100%",
        preserveAspectRatio: "xMidYMid meet",
    });
    const g = el("g", { transform: `translate(${PAD}, ${PAD})` }, svg);

    const blocks = [
        { x: 0, y: 0, w: A, h: A, fill: COLOR.x2, label: "a²", fs: 28 },
        { x: A, y: 0, w: B, h: A, fill: COLOR.x, label: "+ab" },
        { x: 0, y: A, w: A, h: B, fill: COLOR.neg, label: "−ab", opacity: 0.4, dashed: true },
        { x: A, y: A, w: B, h: B, fill: COLOR.neg, label: "−b²", opacity: 0.4, dashed: true },
    ];

    blocks.forEach((blk, i) => drawBlock(g, blk, i));

    labelEdge(g, A / 2, -20, "a");
    labelEdge(g, A + B / 2, -20, "b");
    labelEdge(g, -24, A / 2, "a");
    labelEdge(g, -24, A + B / 2, "−b");

    const top = el("text", { x: W / 2, y: -52, class: "label-text", "font-size": 20 }, g);
    top.textContent = "a + b";
    const left = el("text", {
        x: -58, y: H / 2, class: "label-text", "font-size": 20,
        transform: `rotate(-90, -58, ${H / 2})`,
    }, g);
    left.textContent = "a − b";

    container.appendChild(svg);
}

function drawBlock(g, blk, i) {
    const rect = el("rect", {
        x: blk.x + blk.w / 2, y: blk.y + blk.h / 2,
        width: 0, height: 0,
        fill: blk.fill,
        "fill-opacity": blk.opacity ?? 0.95,
        class: "area-rect" + (blk.dashed ? " negative" : ""),
        rx: 8,
    }, g);
    setTimeout(() => {
        rect.setAttribute("x", blk.x + 2);
        rect.setAttribute("y", blk.y + 2);
        rect.setAttribute("width", blk.w - 4);
        rect.setAttribute("height", blk.h - 4);
    }, 60 * i);

    const t = el("text", {
        x: blk.x + blk.w / 2, y: blk.y + blk.h / 2,
        class: "area-text", "font-size": blk.fs ?? 22,
    }, g);
    t.textContent = blk.label;
}

function labelEdge(g, x, y, text, fs = 18, rotate = 0) {
    const t = el("text", {
        x, y, class: "label-text", "font-size": fs,
    }, g);
    if (rotate) t.setAttribute("transform", `rotate(${rotate}, ${x}, ${y})`);
    t.textContent = text;
}

/* ================================================================
 * ③ 構造把握 (塊)
 * ================================================================ */
const CHUNK_PROBLEMS = [
    {
        id: "p1",
        title: "(x + y + 1)(x + y − 1)",
        pattern: {
            common: "x + y",
            transformed: "(M + 1)(M − 1)",
            focus: "和と差の積",
        },
        steps: [
            {
                html: `<div class="chunk-expression">(<span class="chunk-highlight">x + y</span> + 1)(<span class="chunk-highlight">x + y</span> − 1)</div>`,
                caption: `<strong>同じ部分</strong>に気付こう。両方のカッコに <strong>x + y</strong> が含まれています。`,
            },
            {
                html: `<div class="chunk-expression">x + y = <span class="chunk-M">M</span> とおく</div>
                       <div class="chunk-expression">→ (<span class="chunk-M">M</span> + 1)(<span class="chunk-M">M</span> − 1)</div>`,
                caption: `共通部分を <span class="chunk-M">M</span> で置き換えると、見慣れた形 <strong>(M+1)(M−1)</strong> に！`,
            },
            {
                html: `<div class="chunk-expression">(<span class="chunk-M">M</span> + 1)(<span class="chunk-M">M</span> − 1) = <span class="hl-x2"><span class="chunk-M">M</span>²</span> − <span class="hl-c">1</span></div>`,
                caption: `乗法公式 <strong>(a+b)(a−b) = a² − b²</strong> を使って展開。`,
            },
            {
                html: `<div class="chunk-expression"><span class="chunk-M">M</span> = x + y を戻す</div>
                       <div class="chunk-expression">= (x + y)² − 1</div>
                       <div class="chunk-expression">= <span class="hl-x2">x²</span> + <span class="hl-x">2xy</span> + <span class="hl-x2">y²</span> − <span class="hl-c">1</span></div>`,
                caption: `最後に <span class="chunk-M">M</span> を元に戻して、(x+y)² を展開すれば完成！`,
            },
        ],
    },
    {
        id: "p2",
        title: "(a + b + c)(a + b − c)",
        pattern: {
            common: "a + b",
            transformed: "(M + c)(M − c)",
            focus: "和と差の積",
        },
        steps: [
            {
                html: `<div class="chunk-expression">(<span class="chunk-highlight">a + b</span> + c)(<span class="chunk-highlight">a + b</span> − c)</div>`,
                caption: `両方のカッコに <strong>a + b</strong> が共通しています。`,
            },
            {
                html: `<div class="chunk-expression">a + b = <span class="chunk-M">M</span> とおく</div>
                       <div class="chunk-expression">→ (<span class="chunk-M">M</span> + c)(<span class="chunk-M">M</span> − c)</div>`,
                caption: `共通部分を <span class="chunk-M">M</span> に置換。和と差の積の形が見えました。`,
            },
            {
                html: `<div class="chunk-expression">(<span class="chunk-M">M</span> + c)(<span class="chunk-M">M</span> − c) = <span class="hl-x2"><span class="chunk-M">M</span>²</span> − <span class="hl-c">c²</span></div>`,
                caption: `(a+b)(a−b) = a² − b² で一気に展開。`,
            },
            {
                html: `<div class="chunk-expression"><span class="chunk-M">M</span> = a + b を戻す</div>
                       <div class="chunk-expression">= (a + b)² − c²</div>
                       <div class="chunk-expression">= <span class="hl-x2">a²</span> + <span class="hl-x">2ab</span> + <span class="hl-x2">b²</span> − <span class="hl-c">c²</span></div>`,
                caption: `(a+b)² を展開して完成。`,
            },
        ],
    },
    {
        id: "p3",
        title: "(x − y + 3)(x − y − 4)",
        pattern: {
            common: "x − y",
            transformed: "(M + 3)(M − 4)",
            focus: "和と積",
        },
        steps: [
            {
                html: `<div class="chunk-expression">(<span class="chunk-highlight">x − y</span> + 3)(<span class="chunk-highlight">x − y</span> − 4)</div>`,
                caption: `両方に <strong>x − y</strong> が入っている点に注目。`,
            },
            {
                html: `<div class="chunk-expression">x − y = <span class="chunk-M">M</span> とおく</div>
                       <div class="chunk-expression">→ (<span class="chunk-M">M</span> + 3)(<span class="chunk-M">M</span> − 4)</div>`,
                caption: `置き換えると、(M + a)(M + b) のいつもの形に。`,
            },
            {
                html: `<div class="chunk-expression">(<span class="chunk-M">M</span> + 3)(<span class="chunk-M">M</span> − 4) = <span class="hl-x2"><span class="chunk-M">M</span>²</span> <span class="hl-x">− M</span> <span class="hl-c">− 12</span></div>`,
                caption: `和 3 + (−4) = −1、積 3×(−4) = −12。`,
            },
            {
                html: `<div class="chunk-expression"><span class="chunk-M">M</span> = x − y を戻す</div>
                       <div class="chunk-expression">= (x − y)² − (x − y) − 12</div>
                       <div class="chunk-expression">= <span class="hl-x2">x²</span> − <span class="hl-x">2xy</span> + <span class="hl-x2">y²</span> − x + y − <span class="hl-c">12</span></div>`,
                caption: `最後に (x−y)² を展開し、−(x−y) = −x + y にも注意。`,
            },
        ],
    },
];

function initChunkMode() {
    const tabs = document.getElementById("chunk-tabs");
    const pattern = document.getElementById("chunk-pattern");
    const stage = document.getElementById("chunk-stage");
    const prev = document.getElementById("chunk-prev");
    const next = document.getElementById("chunk-next");
    const indicator = document.getElementById("chunk-step-indicator");

    let currentIdx = 0;
    let step = 0;

    // タブ生成
    CHUNK_PROBLEMS.forEach((p, i) => {
        const b = document.createElement("button");
        b.className = "problem-tab" + (i === 0 ? " active" : "");
        b.textContent = p.title;
        b.dataset.idx = i;
        b.addEventListener("click", () => {
            currentIdx = i;
            step = 0;
            document.querySelectorAll(".problem-tab").forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
            render();
        });
        tabs.appendChild(b);
    });

    const render = () => {
        const prob = CHUNK_PROBLEMS[currentIdx];
        const s = prob.steps[step];
        pattern.innerHTML = `
            <h3>この問題の見方</h3>
            <p>まず <strong>${prob.pattern.common}</strong> をひとかたまりと見て、<strong>${prob.pattern.transformed}</strong> の形にします。</p>
            <div class="meta-chip-row">
                <span class="meta-chip">共通部分: ${prob.pattern.common}</span>
                <span class="meta-chip">置き換え後: ${prob.pattern.transformed}</span>
                <span class="meta-chip">注目する型: ${prob.pattern.focus}</span>
            </div>
        `;
        stage.innerHTML = `${s.html}<p class="chunk-caption">${s.caption}</p>`;
        stage.style.animation = "none";
        stage.offsetHeight; // reflow
        stage.style.animation = "fadeIn 0.4s ease-out";
        indicator.textContent = `Step ${step + 1} / ${prob.steps.length}`;
        prev.disabled = step === 0;
        next.disabled = step === prob.steps.length - 1;
    };

    prev.addEventListener("click", () => {
        if (step > 0) { step--; render(); }
    });
    next.addEventListener("click", () => {
        const prob = CHUNK_PROBLEMS[currentIdx];
        if (step < prob.steps.length - 1) { step++; render(); }
    });

    render();
}

/* ================================================================
 * ④ 練習問題モード
 * ================================================================ */
function initQuizMode() {
    const qEl = document.getElementById("quiz-question");
    const aEl = document.getElementById("quiz-answer");
    const checkBtn = document.getElementById("quiz-check");
    const nextBtn = document.getElementById("quiz-next");
    const hintBtn = document.getElementById("quiz-hint");
    const hintBox = document.getElementById("quiz-hint-box");
    const strategyBox = document.getElementById("quiz-strategy");
    const fb = document.getElementById("quiz-feedback");
    const correctEl = document.getElementById("quiz-correct");
    const totalEl = document.getElementById("quiz-total");
    const streakEl = document.getElementById("quiz-streak");

    let stats = { correct: 0, total: 0, streak: 0 };
    let currentProblem = null;
    let answered = false;

    const updateStats = () => {
        correctEl.textContent = stats.correct;
        totalEl.textContent = stats.total;
        streakEl.textContent = stats.streak;
    };

    const newProblem = () => {
        currentProblem = generateQuizProblem();
        qEl.textContent = currentProblem.display;
        strategyBox.innerHTML = `
            <h3>この問題の見分け方</h3>
            <p>${currentProblem.strategy}</p>
            <div class="meta-chip-row">
                <span class="meta-chip">型: ${currentProblem.label}</span>
                <span class="meta-chip">先に考えること: ${currentProblem.focus}</span>
            </div>
        `;
        aEl.value = "";
        aEl.focus();
        fb.textContent = "";
        fb.className = "quiz-feedback";
        hintBox.innerHTML = "";
        hintBox.className = "quiz-hint";
        answered = false;
    };

    const check = () => {
        if (answered || !currentProblem) return;
        const user = normalizePolynomial(aEl.value);
        const ok = user && user === currentProblem.canonical;
        stats.total++;
        if (ok) {
            stats.correct++;
            stats.streak++;
            fb.className = "quiz-feedback correct";
            fb.innerHTML = `🎉 正解！<span class="answer-line">答え: <strong>${currentProblem.pretty}</strong></span><span class="answer-line">考え方: ${currentProblem.explanation}</span>`;
        } else {
            stats.streak = 0;
            fb.className = "quiz-feedback wrong";
            fb.innerHTML = `❌ 違います。<span class="answer-line">正解: <strong>${currentProblem.pretty}</strong></span><span class="answer-line">考え方: ${currentProblem.explanation}</span>`;
            hintBox.innerHTML = currentProblem.hint;
            hintBox.className = "quiz-hint visible";
        }
        updateStats();
        answered = true;
    };

    checkBtn.addEventListener("click", check);
    nextBtn.addEventListener("click", newProblem);
    hintBtn.addEventListener("click", () => {
        if (!currentProblem) return;
        hintBox.innerHTML = currentProblem.hint;
        hintBox.className = "quiz-hint visible";
    });
    aEl.addEventListener("keypress", (e) => {
        if (e.key !== "Enter") return;
        if (answered) newProblem();
        else check();
    });

    updateStats();
    newProblem();
}

/* ---- 問題生成 ---- */
function generateQuizProblem() {
    // 4 タイプからランダム
    const types = ["xab", "sqPlus", "sqMinus", "diff"];
    const t = types[Math.floor(Math.random() * types.length)];
    const rnd = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

    if (t === "xab") {
        // (x + a)(x + b)、a, b は -7..7 (0除く)
        const a = pickNonZero(-7, 7);
        const b = pickNonZero(-7, 7);
        const sum = a + b;
        const prod = a * b;
        return {
            display: `(x ${signed(a)})(x ${signed(b)}) を展開`,
            canonical: makeCanonical([
                { c: 1, p: 2 }, { c: sum, p: 1 }, { c: prod, p: 0 },
            ]),
            pretty: prettyPoly([
                { c: 1, p: 2 }, { c: sum, p: 1 }, { c: prod, p: 0 },
            ]),
            label: "(x+a)(x+b)",
            focus: "和と積",
            strategy: "2つの数の和が x の係数、積が定数項になります。まず a+b と a×b を見つけます。",
            hint: `ヒント: 真ん中の項は <strong>${formatOrderedTerms([{ c: a, p: 1 }, { c: b, p: 1 }])}</strong> です。まとめると <strong>${formatOrderedTerms([{ c: sum, p: 1 }])}</strong> になります。定数項は <strong>${wrapSigned(a)}×${wrapSigned(b)} = ${mathNumber(prod)}</strong> です。`,
            explanation: `x の項は ${formatOrderedTerms([{ c: a, p: 1 }, { c: b, p: 1 }])} = ${formatOrderedTerms([{ c: sum, p: 1 }])}、定数項は ${wrapSigned(a)}×${wrapSigned(b)} = ${mathNumber(prod)}。`,
        };
    }
    if (t === "sqPlus") {
        // (x + a)²
        const a = rnd(2, 9);
        return {
            display: `(x + ${a})² を展開`,
            canonical: makeCanonical([
                { c: 1, p: 2 }, { c: 2 * a, p: 1 }, { c: a * a, p: 0 },
            ]),
            pretty: prettyPoly([
                { c: 1, p: 2 }, { c: 2 * a, p: 1 }, { c: a * a, p: 0 },
            ]),
            label: "平方公式",
            focus: "真ん中は 2ax",
            strategy: "これは (x+a)² の形です。<strong>x² + 2ax + a²</strong> をそのまま使います。",
            hint: `ヒント: <strong>(x + a)² = x² + 2ax + a²</strong>。ここでは a=${a} なので、真ん中の項は <strong>2×${a}x = ${2 * a}x</strong> です。`,
            explanation: `平方公式より x² + 2×${a}x + ${a}² = x² + ${2 * a}x + ${a * a}。`,
        };
    }
    if (t === "sqMinus") {
        // (x − a)²
        const a = rnd(2, 9);
        return {
            display: `(x − ${a})² を展開`,
            canonical: makeCanonical([
                { c: 1, p: 2 }, { c: -2 * a, p: 1 }, { c: a * a, p: 0 },
            ]),
            pretty: prettyPoly([
                { c: 1, p: 2 }, { c: -2 * a, p: 1 }, { c: a * a, p: 0 },
            ]),
            label: "平方公式",
            focus: "真ん中は -2ax",
            strategy: "これは (x−a)² の形です。<strong>x² − 2ax + a²</strong> を使います。",
            hint: `ヒント: <strong>(x − a)² = x² − 2ax + a²</strong>。ここでは a=${a} なので、真ん中の項は <strong>−2×${a}x = −${2 * a}x</strong> です。`,
            explanation: `平方公式より x² − 2×${a}x + ${a}² = x² − ${2 * a}x + ${a * a}。`,
        };
    }
    // diff: (x + a)(x − a) = x² − a²
    const a = rnd(2, 9);
    return {
        display: `(x + ${a})(x − ${a}) を展開`,
        canonical: makeCanonical([
            { c: 1, p: 2 }, { c: -a * a, p: 0 },
        ]),
        pretty: prettyPoly([
            { c: 1, p: 2 }, { c: -a * a, p: 0 },
        ]),
        label: "和と差の積",
        focus: "真ん中の項は消える",
        strategy: "これは (x+a)(x−a) の形です。<strong>x² − a²</strong> になり、真ん中の x の項は出ません。",
        hint: `ヒント: <strong>(x + a)(x − a) = x² − a²</strong>。ここでは a=${a} なので、<strong>x² − ${a * a}</strong> です。`,
        explanation: `+${a}x と −${a}x が打ち消し合うので、x² − ${a}² = x² − ${a * a}。`,
    };
}

function pickNonZero(lo, hi) {
    let n = 0;
    while (n === 0) n = Math.floor(Math.random() * (hi - lo + 1)) + lo;
    return n;
}

/* ---- 多項式の正規化（入力の比較用） ----
 * 受理: x^2, x², 2x, 12, +, -, − (全角マイナス), 大文字小文字、空白
 * 戻り値: 例 "x2+5x+6" の形に統一した文字列
 */
function normalizePolynomial(input) {
    if (!input) return null;
    let s = input.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/×/g, "*")
        .replace(/[−–—]/g, "-")  // 全角・各種マイナス
        .replace(/[＋]/g, "+")
        .replace(/²/g, "^2")
        .replace(/x\^2/g, "X2")  // 一旦 X2 に退避
        .replace(/\*/g, "");

    // x → x1, 数字+x → 数字x1
    s = s.replace(/x(?!\d)/g, "x1");
    // X2 → x2 に戻す
    s = s.replace(/X2/g, "x2");

    // 各項に分解
    if (!/^[-+]/.test(s)) s = "+" + s;
    const tokens = s.match(/[+-][^+-]+/g);
    if (!tokens) return null;

    const terms = { 0: 0, 1: 0, 2: 0 };
    for (const tk of tokens) {
        const sign = tk[0] === "-" ? -1 : 1;
        const body = tk.slice(1);
        if (body === "") return null;

        // x^2 / x2 系
        let m;
        if ((m = body.match(/^(\d*)x2$/))) {
            const c = m[1] === "" ? 1 : parseInt(m[1], 10);
            terms[2] += sign * c;
        } else if ((m = body.match(/^(\d*)x1$/))) {
            const c = m[1] === "" ? 1 : parseInt(m[1], 10);
            terms[1] += sign * c;
        } else if ((m = body.match(/^(\d+)$/))) {
            terms[0] += sign * parseInt(m[1], 10);
        } else {
            return null; // パース不能
        }
    }
    return makeCanonical([
        { c: terms[2], p: 2 },
        { c: terms[1], p: 1 },
        { c: terms[0], p: 0 },
    ]);
}

function makeCanonical(termList) {
    // 0でない項を p の降順で連結
    return termList
        .filter((t) => t.c !== 0)
        .sort((a, b) => b.p - a.p)
        .map((t) => `${t.c >= 0 ? "+" : "-"}${Math.abs(t.c)}x${t.p}`)
        .join("");
}

function prettyPoly(termList) {
    const parts = termList.filter((t) => t.c !== 0).sort((a, b) => b.p - a.p);
    if (parts.length === 0) return "0";
    return parts
        .map((t, i) => {
            const sign = t.c >= 0 ? (i === 0 ? "" : " + ") : (i === 0 ? "−" : " − ");
            const abs = Math.abs(t.c);
            const coef = abs === 1 && t.p > 0 ? "" : abs;
            const v = t.p === 0 ? "" : t.p === 1 ? "x" : "x²";
            return sign + coef + v;
        })
        .join("");
}
