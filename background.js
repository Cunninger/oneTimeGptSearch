// 添加默认设置定义
const defaultSettings = {
    triggerWord: 'g',
    defaultPrompt: 'Ask: ',
    url: 'https://chatgpt.com/?q={question}&hints=search',
    showContextMenu: true
};

let searchSettings = defaultSettings;

// 加载设置
async function loadSettings() {
    const result = await chrome.storage.sync.get('searchSettings');
    searchSettings = result.searchSettings || defaultSettings;
    updateContextMenu();
}

// 更新右键菜单
function updateContextMenu() {
    chrome.contextMenus.removeAll(() => {
        if (searchSettings.showContextMenu) {
            chrome.contextMenus.create({
                id: "gptSearch",
                title: "使用GPT搜索",
                contexts: ["selection"]
            });
        }
    });
}

// 初始化
chrome.runtime.onInstalled.addListener(() => {
    // 初始化设置
    chrome.storage.sync.get('searchSettings', (result) => {
        if (!result.searchSettings) {
            chrome.storage.sync.set({
                searchSettings: defaultSettings
            });
        }
    });
    loadSettings();
});

// 监听设置更新
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settingsUpdated') {
        loadSettings();
    }
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "gptSearch") {
        openSearch(info.selectionText);
    }
});

// 监听快捷键
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "trigger-search") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            const url = new URL(tab.url);
            const searchText = url.searchParams.get('q') || tab.title;
            if (searchText) {
                openSearch(searchText);
            }
        }
    }
});

// 监听 omnibox 输入
chrome.omnibox.onInputEntered.addListener((text) => {
    if (text.trim()) {
        openSearch(text);
    }
});

// 打开搜索
function openSearch(query) {
    const fullQuery = `${searchSettings.defaultPrompt} ${query}`;
    const url = searchSettings.url.replace('{question}', encodeURIComponent(fullQuery));
    chrome.tabs.create({ url });
} 
