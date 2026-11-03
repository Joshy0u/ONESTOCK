async function loadProducts() {
    const container = document.getElementById('product-list');
    const countLabel = document.getElementById('product-count');

    try {
        const response = await fetch('http://127.0.0.1:8000/products');
        if (!response.ok) throw new Error('Failed to connect to backend');

        const products = await response.json();
        countLabel.innerText = `${products.length} Items Loaded`;

        if (products.length === 0) {
            container.innerHTML = `<p class="text-slate-500 text-center py-8">No products found in database.</p>`;
            return;
        }

        container.innerHTML = '';
        products.forEach(p => {
            container.innerHTML += `
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition">
                    <div class="flex items-center space-x-4">
                        <div class="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg font-mono text-xs text-emerald-400 font-semibold">
                            ${p.sku}
                        </div>
                        <div>
                            <h2 class="text-sm font-medium text-white">${p.name}</h2>
                            <p class="text-xs text-slate-400">${p.special_notes || 'Standard inventory item'}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-6 text-right">
                        <div>
                            <span class="text-xs text-slate-500 block">List Price</span>
                            <span class="text-sm font-bold text-emerald-400">$${p.list_price ? Number(p.list_price).toFixed(2) : '0.00'}</span>
                        </div>
                        <span class="bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[11px] px-2.5 py-1 rounded-full font-medium">In Stock</span>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="bg-red-950/40 border border-red-900 text-red-300 p-4 rounded-xl text-center text-sm">Could not connect to FastAPI backend. Ensure your Uvicorn server is running!</div>`;
        countLabel.innerText = 'Connection Error';
    }
}

function switchScreen(screenName) {
    document.getElementById('screen-title').innerText = screenName.charAt(0).toUpperCase() + screenName.slice(1);
}

// Initialize data fetch on page load
loadProducts();