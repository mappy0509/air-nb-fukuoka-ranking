document.addEventListener('DOMContentLoaded', () => {
    // --- 【重要】Apps ScriptのURLをここに貼り付けてください ---
    const SCRIPT_URLS = {
        pure: 'https://script.google.com/macros/s/AKfycbyZYx-1fdDKu3dnh9CJz_FitF3EeWH8U1KpT_azeM8_AowcyA-eF1KDAbjwSN9Tyx0Z/exec',
        chance: 'https://script.google.com/macros/s/AKfycbxLg6FCUesORy_5aX2_qdZpbtABcgodMKZHMVm_x6sE-BeWoi8kLpHPTLfByAbbaJ1Z/exec'
    };

    // --- データキャッシュ ---
    const cachedData = { hosts: {}, stores: {} };

    // --- アプリケーションの状態 ---
    let currentCategory = 'personal_sales';
    const currentMonth = new Date().getMonth() + 1;
    let currentPeriod = currentMonth; // 'yearly' または 1-12 の月の数字

    // --- DOM要素 ---
    const categorySelector = document.getElementById('category-selector');
    const monthSelector = document.getElementById('month-selector');
    const yearlyButton = document.getElementById('yearly-button');
    const rankingList = document.getElementById('ranking-list');
    const rankingTitle = document.getElementById('ranking-title');

    // --- 関数 ---

    // 文字列から通貨記号やカンマを取り除いて数値に変換するヘルパー関数
    const cleanNumber = (str) => {
        if (typeof str !== 'string') return 0;
        // 数字と小数点以外の文字をすべて除去する
        return Number(str.replace(/[^0-9.]/g, '')) || 0;
    };

    const parseSheetCsv = (csvText) => {
        if (!csvText || csvText.trim() === '') return { hosts: [], store: null };
        
        const lines = csvText.trim().split('\n');
        const hosts = [];
        let storeData = null;

        // ヘッダー行を解析して、どの列に何のデータがあるか動的に判断
        const header = lines[0].split(',').map(h => h.trim());
        const storeNameColIndex = header.findIndex(h => h.includes('店舗名'));
        const hostNameColIndex = header.findIndex(h => h.includes('名前'));
        // 【修正点】より柔軟なヘッダー名検索に対応
        const salesColIndex = header.findIndex(h => h.includes('売') && !h.includes('店舗'));
        const nomsColIndex = header.findIndex(h => h.includes('指名') && !h.includes('店舗'));
        const storeSalesColIndex = header.findIndex(h => h.includes('店舗') && h.includes('売'));
        const storeNomsColIndex = header.findIndex(h => h.includes('店舗') && h.includes('指名'));

        lines.slice(1).forEach(line => {
            const values = line.split(',');
            // ホスト名がその列に存在する場合のみ処理
            if (hostNameColIndex !== -1 && values.length > hostNameColIndex && values[hostNameColIndex] && values[hostNameColIndex].trim()) {
                hosts.push({
                    store: (storeNameColIndex !== -1 && values[storeNameColIndex]) ? values[storeNameColIndex].trim() : '',
                    name: values[hostNameColIndex].trim(),
                    sales: (salesColIndex !== -1) ? cleanNumber(values[salesColIndex]) : 0,
                    nominations: (nomsColIndex !== -1) ? cleanNumber(values[nomsColIndex]) : 0,
                });
            }
            // 最初の有効な行から店舗データを一度だけ取得
            if (!storeData && storeSalesColIndex !== -1 && values.length > storeSalesColIndex && values[storeSalesColIndex]?.trim()) {
                storeData = {
                    name: (storeNameColIndex !== -1 && values[storeNameColIndex]) ? values[storeNameColIndex].trim() : '',
                    sales: cleanNumber(values[storeSalesColIndex]),
                    nominations: (storeNomsColIndex !== -1) ? cleanNumber(values[storeNomsColIndex]) : 0,
                };
            }
        });
        return { hosts, store: storeData };
    };

    // 年間データを集計する関数
    const aggregateYearlyData = (monthlyData) => {
        const aggregatedHosts = {};
        const aggregatedStores = {};

        monthlyData.forEach(month => {
            // ホストのデータを集計
            month.hosts.forEach(host => {
                if (!aggregatedHosts[host.name]) {
                    aggregatedHosts[host.name] = { ...host, sales: 0, nominations: 0 };
                }
                aggregatedHosts[host.name].sales += host.sales;
                aggregatedHosts[host.name].nominations += host.nominations;
            });
            // 店舗のデータを集計
            month.stores.forEach(store => {
                if (!aggregatedStores[store.name]) {
                    aggregatedStores[store.name] = { ...store, sales: 0, nominations: 0 };
                }
                aggregatedStores[store.name].sales += store.sales;
                aggregatedStores[store.name].nominations += store.nominations;
            });
        });

        return {
            hosts: Object.values(aggregatedHosts),
            stores: Object.values(aggregatedStores)
        };
    };
    
    const loadDataForPeriod = async (period) => {
        if (cachedData.hosts[period]) return; // キャッシュがあれば何もしない
    
        rankingList.innerHTML = `<p class="text-center text-gray-400">データを読み込み中...</p>`;
    
        try {
            if (period === 'yearly') {
                const monthlyPromises = [];
                for (let month = 1; month <= 12; month++) {
                    monthlyPromises.push(loadDataForPeriod(month));
                }
                await Promise.all(monthlyPromises); // 全ての月のデータ読み込みを待つ
    
                const allMonthlyData = { hosts: [], stores: [] };
                for (let month = 1; month <= 12; month++) {
                    if (cachedData.hosts[month]) {
                        allMonthlyData.hosts.push(...cachedData.hosts[month]);
                    }
                    if (cachedData.stores[month]) {
                        allMonthlyData.stores.push(...cachedData.stores[month]);
                    }
                }
    
                const yearlyHosts = {};
                allMonthlyData.hosts.forEach(host => {
                    if (!yearlyHosts[host.name]) {
                        yearlyHosts[host.name] = { ...host, sales: 0, nominations: 0 };
                    }
                    yearlyHosts[host.name].sales += host.sales;
                    yearlyHosts[host.name].nominations += host.nominations;
                });
    
                const yearlyStores = {};
                allMonthlyData.stores.forEach(store => {
                    if (!yearlyStores[store.name]) {
                        yearlyStores[store.name] = { ...store, sales: 0, nominations: 0 };
                    }
                    yearlyStores[store.name].sales += store.sales;
                    yearlyStores[store.name].nominations += store.nominations;
                });
    
                cachedData.hosts['yearly'] = Object.values(yearlyHosts);
                cachedData.stores['yearly'] = Object.values(yearlyStores);
    
            } else {
                const [pureRes, chanceRes] = await Promise.all([
                    fetch(`${SCRIPT_URLS.pure}?sheet=${period}`),
                    fetch(`${SCRIPT_URLS.chance}?sheet=${period}`)
                ]);
    
                const [pureCsv, chanceCsv] = await Promise.all([pureRes.text(), chanceRes.text()]);
    
                const pureData = parseSheetCsv(pureCsv);
                const chanceData = parseSheetCsv(chanceCsv);
    
                cachedData.hosts[period] = [...pureData.hosts, ...chanceData.hosts];
                cachedData.stores[period] = [pureData.store, chanceData.store].filter(Boolean);
            }
        } catch (error) {
            console.error(`'${period}'のデータ取得エラー:`, error);
            cachedData.hosts[period] = [];
            cachedData.stores[period] = [];
            rankingList.innerHTML = `<p class="text-center text-red-400">データの読み込みに失敗しました。</p>`;
        }
    };

    const formatNumber = (num) => (typeof num === 'number' ? num.toLocaleString() : '');
    const getCrownIcon = (rank) => {
        switch (rank) {
            case 1: return '<i class="fas fa-crown text-yellow-400"></i>';
            case 2: return '<i class="fas fa-crown text-gray-400"></i>';
            case 3: return '<i class="fas fa-crown text-amber-600"></i>';
            default: return `<span class="font-bold text-gray-500">${rank}</span>`;
        }
    };

    const renderRanking = () => {
        let data, key, unit, titlePrefix;
        const isPersonal = currentCategory.startsWith('personal');
        const isSales = currentCategory.endsWith('sales');

        if (isPersonal) {
            data = cachedData.hosts[currentPeriod] || [];
            key = isSales ? 'sales' : 'nominations';
            unit = isSales ? '円' : '本';
            titlePrefix = isSales ? '個人売上' : '個人指名本数';
        } else {
            data = cachedData.stores[currentPeriod] || [];
            key = isSales ? 'sales' : 'nominations';
            unit = isSales ? '円' : '本';
            titlePrefix = isSales ? '店舗売上' : '店舗指名本数';
        }

        const periodText = currentPeriod === 'yearly' ? '年間合計' : `${currentPeriod}月`;
        rankingTitle.textContent = `${periodText} ${titlePrefix}ランキング`;

        if (!data || data.length === 0) {
            rankingList.innerHTML = `<p class="text-center text-gray-400 mt-8">この期間のデータはまだありません。</p>`;
            return;
        }

        data.sort((a, b) => b[key] - a[key]);
        rankingList.innerHTML = data.map((item, index) => {
            const rank = index + 1;
            if (isPersonal) {
                return `
                    <div class="ranking-item bg-gray-900 bg-opacity-70 p-3 rounded-lg flex items-center gap-4 transition-all duration-300 gradient-border">
                        <div class="w-10 text-center text-xl">${getCrownIcon(rank)}</div>
                        <div class="flex-1">
                            <p class="font-bold text-lg text-white">${item.name}</p>
                            <p class="text-sm ${item.store.includes('PURE') ? 'text-cyan-400' : 'text-purple-400'}">${item.store}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-xl text-amber-300">${formatNumber(item[key])}${unit}</p>
                        </div>
                    </div>`;
            } else {
                return `
                    <div class="ranking-item bg-gray-900 bg-opacity-70 p-4 rounded-lg flex items-center gap-4 transition-all duration-300 gradient-border">
                        <div class="w-10 text-center text-2xl">${getCrownIcon(rank)}</div>
                        <div class="flex-1">
                            <p class="font-bold text-2xl ${item.name.includes('PURE') ? 'text-cyan-400' : 'text-purple-400'}">${item.name}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-2xl text-amber-300">${formatNumber(item[key])}${unit}</p>
                        </div>
                    </div>`;
            }
        }).join('');
    };

    const updateButtonStates = () => {
        document.querySelectorAll('#category-selector button').forEach(btn => {
            btn.classList.toggle('btn-active', btn.dataset.category === currentCategory);
        });
        yearlyButton.classList.toggle('btn-active', currentPeriod === 'yearly');
        monthSelector.classList.toggle('btn-active', currentPeriod !== 'yearly');
    };
    
    const handlePeriodChange = async (newPeriod) => {
        currentPeriod = newPeriod;
        await loadDataForPeriod(currentPeriod);
        updateButtonStates();
        renderRanking();
    };

    const initialize = async () => {
        // 月選択プルダウンを生成
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}月`;
            monthSelector.appendChild(option);
        }
        monthSelector.value = currentMonth;

        // イベントリスナーを設定
        categorySelector.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                currentCategory = e.target.dataset.category;
                updateButtonStates();
                renderRanking();
            }
        });
        monthSelector.addEventListener('change', (e) => handlePeriodChange(Number(e.target.value)));
        yearlyButton.addEventListener('click', () => handlePeriodChange('yearly'));

        // 初期データを読み込んで表示
        await loadDataForPeriod(currentPeriod);
        updateButtonStates();
        renderRanking();
    };

    initialize();
});