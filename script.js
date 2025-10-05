document.addEventListener('DOMContentLoaded', () => {
    // --- ダミーデータ ---

    // ホストのダミーデータ（画像なし）
    const hosts = [
        { name: "神咲 麗", store: "AIR-PURE", monthlySales: 8500000, monthlyNominations: 180, yearlySales: 98000000, yearlyNominations: 2100 },
        { name: "一条 蘭", store: "AIR-CHANCE", monthlySales: 8250000, monthlyNominations: 175, yearlySales: 95000000, yearlyNominations: 2050 },
        { name: "桐生 陸", store: "AIR-PURE", monthlySales: 7800000, monthlyNominations: 160, yearlySales: 89000000, yearlyNominations: 1900 },
        { name: "藤堂 蓮", store: "AIR-CHANCE", monthlySales: 7500000, monthlyNominations: 165, yearlySales: 85000000, yearlyNominations: 1950 },
        { name: "如月 旬", store: "AIR-PURE", monthlySales: 6900000, monthlyNominations: 150, yearlySales: 78000000, yearlyNominations: 1800 },
        { name: "早乙女 律", store: "AIR-CHANCE", monthlySales: 6500000, monthlyNominations: 145, yearlySales: 75000000, yearlyNominations: 1750 },
        { name: "天馬 翔", store: "AIR-PURE", monthlySales: 6100000, monthlyNominations: 130, yearlySales: 71000000, yearlyNominations: 1600 },
        { name: "夜神 月", store: "AIR-CHANCE", monthlySales: 5800000, monthlyNominations: 125, yearlySales: 68000000, yearlyNominations: 1550 },
        { name: "鳳 鏡夜", store: "AIR-PURE", monthlySales: 5500000, monthlyNominations: 120, yearlySales: 65000000, yearlyNominations: 1500 },
        { name: "流川 楓", store: "AIR-CHANCE", monthlySales: 5200000, monthlyNominations: 115, yearlySales: 62000000, yearlyNominations: 1450 }
    ];

    // 店舗のダミーデータ
    const stores = [
        { name: "AIR-PURE", monthlySales: 88000000, monthlyNominations: 1800, yearlySales: 1020000000, yearlyNominations: 21000 },
        { name: "AIR-CHANCE", monthlySales: 85000000, monthlyNominations: 1750, yearlySales: 980000000, yearlyNominations: 20500 }
    ];

    // --- アプリケーションの状態 ---
    let currentCategory = 'personal_sales'; // personal_sales, personal_nominations, store_sales, store_nominations
    let currentPeriod = 'monthly'; // monthly, yearly

    // --- DOM要素 ---
    const categorySelector = document.getElementById('category-selector');
    const periodSelector = document.getElementById('period-selector');
    const rankingList = document.getElementById('ranking-list');
    const rankingTitle = document.getElementById('ranking-title');
    
    // --- 関数 ---

    // 数値をフォーマットする関数 (例: 1000000 -> 1,000,000)
    const formatNumber = (num) => num.toLocaleString();

    // 王冠アイコンを取得する関数
    const getCrownIcon = (rank) => {
        switch (rank) {
            case 1: return '<i class="fas fa-crown text-yellow-400"></i>';
            case 2: return '<i class="fas fa-crown text-gray-400"></i>';
            case 3: return '<i class="fas fa-crown text-amber-600"></i>';
            default: return `<span class="font-bold text-gray-500">${rank}</span>`;
        }
    };
    
    // ランキングを描画する関数
    const renderRanking = () => {
        // 1. データの準備
        let data, key, unit, titlePrefix;
        const isPersonal = currentCategory.startsWith('personal');
        const isSales = currentCategory.endsWith('sales');
        
        if (isPersonal) {
            data = [...hosts];
            if (isSales) {
                key = currentPeriod === 'monthly' ? 'monthlySales' : 'yearlySales';
                unit = '円';
                titlePrefix = '個人売上';
            } else {
                key = currentPeriod === 'monthly' ? 'monthlyNominations' : 'yearlyNominations';
                unit = '本';
                titlePrefix = '個人指名本数';
            }
        } else { // 店舗ランキング
            data = [...stores];
            if (isSales) {
                key = currentPeriod === 'monthly' ? 'monthlySales' : 'yearlySales';
                unit = '円';
                titlePrefix = '店舗売上';
            } else {
                key = currentPeriod === 'monthly' ? 'monthlyNominations' : 'yearlyNominations';
                unit = '本';
                titlePrefix = '店舗指名本数';
            }
        }
        
        // 2. データのソート
        data.sort((a, b) => b[key] - a[key]);

        // 3. タイトルの更新
        const periodText = currentPeriod === 'monthly' ? '月間' : '年間';
        rankingTitle.textContent = `${periodText}${titlePrefix}ランキング`;

        // 4. HTMLの生成
        rankingList.innerHTML = ''; // 一旦クリア
        data.forEach((item, index) => {
            const rank = index + 1;
            
            let itemHtml = '';

            if (isPersonal) {
                itemHtml = `
                    <div class="ranking-item bg-gray-900 bg-opacity-70 p-3 rounded-lg flex items-center gap-4 transition-all duration-300 gradient-border">
                        <div class="w-10 text-center text-xl">${getCrownIcon(rank)}</div>
                        <div class="flex-1">
                            <p class="font-bold text-lg text-white">${item.name}</p>
                            <p class="text-sm ${item.store === 'AIR-PURE' ? 'text-cyan-400' : 'text-purple-400'}">${item.store}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-xl text-amber-300">${formatNumber(item[key])}${unit}</p>
                        </div>
                    </div>
                `;
            } else { // 店舗用
                 itemHtml = `
                    <div class="ranking-item bg-gray-900 bg-opacity-70 p-4 rounded-lg flex items-center gap-4 transition-all duration-300 gradient-border">
                        <div class="w-10 text-center text-2xl">${getCrownIcon(rank)}</div>
                        <div class="flex-1">
                            <p class="font-bold text-2xl ${item.name === 'AIR-PURE' ? 'text-cyan-400' : 'text-purple-400'}">${item.name}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-2xl text-amber-300">${formatNumber(item[key])}${unit}</p>
                        </div>
                    </div>
                `;
            }

            rankingList.insertAdjacentHTML('beforeend', itemHtml);
        });
    };

    // ボタンの選択状態を更新する関数
    const updateButtonStates = () => {
        // カテゴリボタン
        document.querySelectorAll('#category-selector button').forEach(btn => {
            btn.classList.toggle('btn-active', btn.dataset.category === currentCategory);
        });
        // 期間ボタン
        document.querySelectorAll('#period-selector button').forEach(btn => {
            btn.classList.toggle('btn-active', btn.dataset.period === currentPeriod);
        });
    };

    // --- イベントリスナー ---
    categorySelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            currentCategory = e.target.dataset.category;
            updateButtonStates();
            renderRanking();
        }
    });

    periodSelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            currentPeriod = e.target.dataset.period;
            updateButtonStates();
            renderRanking();
        }
    });


    // --- 初期化処理 ---
    const initialize = () => {
        updateButtonStates();
        renderRanking();
    };

    initialize();
});
