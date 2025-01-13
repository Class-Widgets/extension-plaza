async function fetchPlugins() {
    const response = await fetch('https://raw.github.store/Class-Widgets/plugin-plaza/refs/heads/main/Plugins/plugin_list.json');
    const data = await response.json();
    
    const pluginListDiv = document.getElementById('plugin-list');
    for (const key in data) {
        const plugin = data[key];
        const urlPath = plugin.url.replace('https://github.com/', '');
        const imageUrl = `https://raw.github.store/${urlPath}/refs/heads/main/icon.png`;
        
        const card = document.createElement('div');
        card.className = 'card ms-card';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${plugin.name} 图标">
            <div class="card-content">
                <h2>${plugin.name}</h2>
                <p class="version">版本: ${plugin.version}</p>
                <p class="author">作者: ${plugin.author}</p>
                <p><strong>描述:</strong> ${plugin.description}</p>
            </div>
        `;
        card.addEventListener('click', () => showDetails(plugin, imageUrl));
        pluginListDiv.appendChild(card);
    }
}

function showDetails(plugin, imageUrl) {
    document.getElementById('details-img').src = imageUrl;
    document.getElementById('details-title').textContent = plugin.name;
    document.getElementById('details-version').textContent = `版本: ${plugin.version}`;
    document.getElementById('details-author').textContent = `作者: ${plugin.author}`;
    document.getElementById('details-description').textContent = plugin.description;
    document.getElementById('details-link').href = plugin.url;

    document.getElementById('overlay').style.display = 'block';
    document.getElementById('details').style.display = 'block';
}

function hideDetails() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('details').style.display = 'none';
}

document.getElementById('overlay').addEventListener('click', hideDetails);
document.getElementById('close-details').addEventListener('click', hideDetails);

fetchPlugins().catch(error => {
    console.error('获取插件数据时出错:', error);
});
