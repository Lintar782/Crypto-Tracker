document.addEventListener('DOMContentLoaded', () => {
    
    // ===== DOM Elements =====
    const cryptoContainer = document.getElementById('crypto-container');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingSpinner = document.getElementById('loading-spinner');
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    const currencyToggle = document.getElementById('currency-toggle')

    // ===== State =====
    let allCoinsData = []; // Menyimpan data asli dari API
    let coinsPerPage = 50; // Default filter
    let vs_currency = 'usd'; // Mata uang (bisa diubah ke 'idr')
    const REFRESH_INTERVAL = 30000; // 30 detik

    // ===== Helper Functions =====

    /**
     * Format angka menjadi format mata uang USD
     */
    const formatCurrency = (number) => {
        let locale = (vs_currency === 'usd') ? 'en-US' : 'id-ID'

        const options = {
            style: 'currency',
            currency: vs_currency,
            minimumFractionDigits: (vs_currency === 'idr') ? 0 : 2,
            maximumFractionDigits: (vs_currency === 'idr') ? 0 : 6,
        }
        return new Intl.NumberFormat(locale, options).format(number);
        // return new Intl.NumberFormat(locale, options).format(number); // <-- 'options' di sini
        // return new Intl.NumberFormat('en-US', {
        //     style: 'currency',
        //     currency: API_CURRENCY,
        //     minimumFractionDigits: 2,
        //     maximumFractionDigits: 6, // Untuk harga koin yang sangat kecil
        // }).format(number);
    };

    // BENAR
    const formatLargeNumber = (number) => {
        // Langsung saja ke logikanya
        const locale = (vs_currency === 'usd') ? 'en-US' : 'id-ID';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: vs_currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    };      

    /**
     * Menampilkan atau menyembunyikan loading spinner
     */
    const showLoading = (isLoading) => {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
        if (isLoading) {
            cryptoContainer.innerHTML = ''; // Kosongkan kontainer saat loading
        }
    };

    // ===== API Fetching =====

    /**
     * Mengambil data dari CoinGecko API
     */
    async function fetchCryptoData() {
        showLoading(true);
        try {
            // Ganti ke 'vs_currency'
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${coinsPerPage}&page=1&sparkline=false`);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
    
            allCoinsData = await response.json();
            renderCryptoTable(allCoinsData); 
    
        } catch (error) {
            console.error('Gagal mengambil data crypto:', error);
            cryptoContainer.innerHTML = `<p class="error-message">Gagal memuat data. Silakan coba lagi nanti.</p>`;
        
        } finally {
            showLoading(false);
        }
    }

    // ===== Rendering =====

    /**
     * Merender data koin ke dalam tabel HTML
     */
    function renderCryptoTable(coins) {
        // 1. Dapatkan filter pencarian
        const searchTerm = searchInput.value.toLowerCase();

        // 2. Filter data berdasarkan pencarian
        const filteredCoins = coins.filter(coin => 
            coin.name.toLowerCase().includes(searchTerm) || 
            coin.symbol.toLowerCase().includes(searchTerm)
        );

        // 3. Jika tidak ada hasil
        if (filteredCoins.length === 0) {
            cryptoContainer.innerHTML = '<p>Tidak ada koin yang cocok ditemukan.</p>';
            return;
        }

        // 4. Buat HTML tabel
        const tableHeader = `
            <table class="crypto-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Koin</th>
                        <th class="align-right">Harga</th>
                        <th class="align-right">24j %</th>
                        <th class="align-right">Market Cap</th>
                        <th class="align-right">Volume (24j)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const tableFooter = `</tbody></table>`;

        // 5. Buat baris untuk setiap koin
        const tableRows = filteredCoins.map((coin, index) => {
            const priceChange = coin.price_change_percentage_24h;
            const changeClass = priceChange >= 0 ? 'price-up' : 'price-down';
            
            // Atribut data-label digunakan untuk tampilan card responsif di mobile
            return `
                <tr>
                    <td data-label="#">${index + 1}</td>
                    <td data-label="Koin">
                        <div class="coin-name">
                            <img src="${coin.image}" alt="${coin.name} logo">
                            <div>
                                <span class="name">${coin.name}</span>
                                <span class="symbol">${coin.symbol}</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="Harga" class="align-right">${formatCurrency(coin.current_price)}</td>
                    <td data-label="24j %" class="align-right ${changeClass}">${priceChange.toFixed(2)}%</td>
                    <td data-label="Market Cap" class="align-right">${formatLargeNumber(coin.market_cap)}</td>
                    <td data-label="Volume (24j)" class="align-right">${formatLargeNumber(coin.total_volume)}</td>
                </tr>
            `;
        }).join('');

        // 6. Gabungkan semua dan masukkan ke DOM
        cryptoContainer.innerHTML = tableHeader + tableRows + tableFooter;
    }


    // ===== Theme Management =====

    /**
     * Menerapkan tema berdasarkan localStorage atau preferensi sistem
     */
    function applyInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    /**
     * Toggle tema dark/light
     */
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        // Simpan preferensi pengguna
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
    }

    function toggleCurrency() {
        if (vs_currency === 'usd') {
            vs_currency = 'idr';
            currencyToggle.textContent = 'Ubah ke USD';
        } else {
            vs_currency = 'usd';
            currencyToggle.textContent = 'Ubah ke IDR';
        }
        
        // Ambil data baru dengan mata uang yang diperbarui
        fetchCryptoData();
    }

    // ===== Scroll to Top =====

    /**
     * Menampilkan atau menyembunyikan tombol "Scroll to Top"
     */
    function handleScroll() {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    }

    /**
     * Scroll ke atas halaman
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // ===== Event Listeners =====


    // Listener untuk Search Bar (real-time filtering)
    searchInput.addEventListener('input', () => {
        renderCryptoTable(allCoinsData); // Filter data yang sudah ada, bukan fetch baru
    });

    // Listener untuk Filter Dropdown (fetch data baru)
    filterSelect.addEventListener('change', (e) => {
        coinsPerPage = parseInt(e.target.value, 10);
        fetchCryptoData(); // Ambil data baru berdasarkan filter
    });

    // Listener untuk Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Listener untuk Scroll
    window.addEventListener('scroll', handleScroll);

    // Listener untuk Tombol Scroll to Top
    scrollTopBtn.addEventListener('click', scrollToTop);

    currencyToggle.addEventListener('click', toggleCurrency)

    // ===== Inisialisasi =====
    
    applyInitialTheme(); // Terapkan tema saat load
    fetchCryptoData(); // Ambil data saat load

    // Atur auto-refresh
    setInterval(fetchCryptoData, REFRESH_INTERVAL);
});