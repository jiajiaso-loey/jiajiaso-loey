// ==UserScript==
// @name         珈珈搜索 - 一站式网盘资源搜索工具，支持百度网盘、夸克网盘、阿里云盘、迅雷网盘、UC网盘、天翼网盘、115网盘、123网盘资源搜索
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  专业的网盘资源搜索工具，支持百度网盘、夸克网盘、阿里云盘等主流网盘资源搜索
// @author       珈珈搜索团队
// @match        *://pan.baidu.com/*
// @match        *://www.aliyundrive.com/*
// @match        *://www.alipan.com/*
// @match        *://pan.quark.cn/*
// @match        *://pan.xunlei.com/*
// @match        *://www.uc.cn/*
// @match        *://www.115.com/*
// @match        *://cloud.189.cn/*
// @match        *://www.123pan.com/*
// @match        *://www.123912.com/*
// @match        *://www.123684.com/*
// @icon         https://feapi.xyz/ing/favicon-32.png
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      feapi.xyz
// ==/UserScript==

(function() {
    'use strict';

    // 支持的网盘类型映射
    const PANEL_MAPPINGS = {
        'pan.baidu.com': '百度网盘',
        'www.aliyundrive.com': '阿里云盘',
        'www.alipan.com': '阿里云盘',
        'pan.quark.cn': '夸克网盘',
        'pan.xunlei.com': '迅雷网盘',
        'www.uc.cn': 'UC网盘',
        'www.115.com': '115网盘',
        'cloud.189.cn': '天翼网盘',
        'www.123pan.com': '123网盘',
        'www.123912.com': '123网盘',
        'www.123684.com': '123网盘'
    };

    // 获取当前网盘类型
    function getCurrentPanelType() {
        for (const [domain, name] of Object.entries(PANEL_MAPPINGS)) {
            if (window.location.hostname.includes(domain)) {
                return name;
            }
        }
        return null;
    }

    // 创建搜索UI组件
    function createSearchUI() {
        // 创建主容器
        const container = document.createElement('div');
        container.id = 'jj-search-container';
        container.style.display = 'none';
        
        // 创建标题栏
        const header = document.createElement('div');
        header.id = 'jj-search-header';
        header.innerHTML = `
            <div class="jj-search-header-content">
                <div class="jj-search-logo">
                    <span class="jj-search-name">珈珈搜索</span>
                    <span class="jj-search-version">v2.0</span>
                </div>
                <button id="jj-search-close">×</button>
            </div>
        `;
        
        // 创建公告区域
        const announcement = document.createElement('div');
        announcement.id = 'jj-search-announcement';
        announcement.innerHTML = `
            <div class="jj-announcement-content">
                <i class="jj-announcement-icon">📢</i>
                <span>欢迎使用珈珈搜索！本工具支持多种网盘资源搜索，祝您搜索愉快！</span>
            </div>
        `;
        
        // 创建搜索框
        const searchBox = document.createElement('div');
        searchBox.id = 'jj-search-box';
        searchBox.innerHTML = `
            <input type="text" id="jj-search-input" placeholder="请输入搜索关键词..." />
            <button id="jj-search-btn">搜索</button>
        `;
        
        // 创建结果容器
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'jj-search-results';
        resultsContainer.innerHTML = '<div id="jj-search-loading" style="display: none; padding: 20px; text-align: center;">搜索中...</div>';
        
        container.appendChild(header);
        container.appendChild(announcement);
        container.appendChild(searchBox);
        container.appendChild(resultsContainer);
        document.body.appendChild(container);
        
        // 添加事件监听
        document.getElementById('jj-search-btn').addEventListener('click', performSearch);
        document.getElementById('jj-search-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        document.getElementById('jj-search-close').addEventListener('click', function() {
            container.style.display = 'none';
        });
    }

    // 创建搜索图标
    function createSearchIcon() {
        const icon = document.createElement('div');
        icon.id = 'jj-search-icon';
        icon.title = '珈珈搜索';
        document.body.appendChild(icon);
        
        // 添加点击事件
        icon.addEventListener('click', function() {
            const container = document.getElementById('jj-search-container');
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
            if (container.style.display === 'block') {
                document.getElementById('jj-search-input').focus();
            }
        });
    }

    // 执行搜索
    function performSearch() {
        const keyword = document.getElementById('jj-search-input').value.trim();
        if (!keyword) {
            alert('请输入搜索关键词');
            return;
        }
        
        const resultsContainer = document.getElementById('jj-search-results');
        const loading = document.getElementById('jj-search-loading');
        
        // 显示加载状态
        resultsContainer.innerHTML = '<div id="jj-search-loading" style="padding: 20px; text-align: center;">搜索中...</div>';
        
        // 调用API搜索 - 使用GM_xmlhttpRequest解决跨域问题
        const apiUrl = `https://feapi.xyz/api/sing.php?query=${encodeURIComponent(keyword)}`;
        
        try {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                // 优先使用GM_xmlhttpRequest
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    timeout: 10000, // 10秒超时
                    onload: function(response) {
                        try {
                            const data = JSON.parse(response.responseText);
                            displayResults(data);
                        } catch (e) {
                            resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
                            console.error('解析API响应错误:', e);
                        }
                    },
                    onerror: function(error) {
                        resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
                        console.error('API请求错误:', error);
                    },
                    ontimeout: function() {
                        resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
                    }
                });
            } else {
                // 降级方案，使用fetch并添加超时处理
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                fetch(apiUrl, { signal: controller.signal })
                    .then(response => {
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            throw new Error(`HTTP错误: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        displayResults(data);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        if (error.name === 'AbortError') {
                            resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
                        } else {
                            resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
                        }
                        console.error('搜索API错误:', error);
                    });
            }
        } catch (e) {
            resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
            console.error('搜索功能初始化错误:', e);
        }
    }

    // 显示搜索结果
    function displayResults(data) {
        const resultsContainer = document.getElementById('jj-search-results');
        const currentPanelType = getCurrentPanelType();
        
        if (data.code !== 200) {
            resultsContainer.innerHTML = `<div class="jj-search-error" style="padding: 20px; color: red; text-align: center;">搜索出错啦，请到主站<a href="https://feapi.xyz/" target="_blank" style="color: blue;"><strong>珈珈搜索</strong></a>进行搜索！</div>`;
            return;
        }
        
        if (!data.data || data.data.length === 0) {
            resultsContainer.innerHTML = '<div class="jj-search-empty" style="padding: 20px; text-align: center;">未找到相关资源</div>';
            return;
        }
        
        // 优先显示当前网盘类型的资源，保持API返回的原始顺序
        const sortedResults = [...data.data].sort((a, b) => {
            const aIsCurrent = isCurrentPanelResource(a.link, currentPanelType);
            const bIsCurrent = isCurrentPanelResource(b.link, currentPanelType);
            
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            
            // 保持API返回的原始顺序
            return 0;
        });
        
        // 存储排序后的结果，用于分页
        window.jjSearchResults = sortedResults;
        window.jjSearchCurrentPage = 1;
        window.jjSearchPageSize = 10; // 进一步减小每页显示数量，避免溢出
        
        // 渲染当前页结果
        renderPageResults();
    }
    
    // 渲染指定页的结果
    function renderPageResults() {
        const resultsContainer = document.getElementById('jj-search-results');
        const sortedResults = window.jjSearchResults || [];
        const currentPage = window.jjSearchCurrentPage || 1;
        const pageSize = window.jjSearchPageSize || 10;
        
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedResults = sortedResults.slice(startIndex, startIndex + pageSize);
        const totalPages = Math.ceil(sortedResults.length / pageSize);
        
        // 构建结果HTML，添加防溢出措施
        let html = '<div class="jj-search-results-list">';
        paginatedResults.forEach((item, index) => {
            const resourceType = getResourceType(item.link);
            const iconClass = getResourceIconClass(resourceType);
            const actualIndex = startIndex + index;
            
            // 安全处理文件名，防止过长导致布局问题
            const safeName = item.name || '未知文件名';
            
            html += `
                <div class="jj-search-result-item" data-index="${actualIndex}">
                    <div class="jj-search-result-icon ${iconClass}">${getShortName(resourceType)}</div>
                    <div class="jj-search-result-info">
                        <div class="jj-search-result-name" title="${safeName}">${safeName}</div>
                        <div class="jj-search-result-meta">
                            <span class="jj-search-result-source">${resourceType}</span>
                            <span class="jj-search-result-time">${item.time || '未知时间'}</span>
                        </div>
                    </div>
                    <div class="jj-search-result-actions">
                        <a href="${item.link.trim()}" target="_blank" class="jj-search-result-link">打开链接</a>
                        <button class="jj-search-result-copy" data-link="${item.link.trim()}">复制链接</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        // 添加分页
        if (totalPages > 1) {
            html += `
                <div class="jj-search-pagination">
                    <button id="jj-search-prev" ${currentPage <= 1 ? 'disabled' : ''}>上一页</button>
                    <span>第 ${currentPage}/${totalPages} 页，共 ${sortedResults.length} 条结果</span>
                    <button id="jj-search-next" ${currentPage >= totalPages ? 'disabled' : ''}>下一页</button>
                </div>
            `;
        }
        
        resultsContainer.innerHTML = html;
        
        // 添加分页按钮事件
        document.getElementById('jj-search-prev')?.addEventListener('click', function() {
            if (window.jjSearchCurrentPage > 1) {
                window.jjSearchCurrentPage--;
                renderPageResults();
            }
        });
        
        document.getElementById('jj-search-next')?.addEventListener('click', function() {
            const totalPages = Math.ceil((window.jjSearchResults || []).length / (window.jjSearchPageSize || 15));
            if (window.jjSearchCurrentPage < totalPages) {
                window.jjSearchCurrentPage++;
                renderPageResults();
            }
        });
        
        // 添加复制链接事件
        document.querySelectorAll('.jj-search-result-copy').forEach(btn => {
            btn.addEventListener('click', function() {
                const link = this.getAttribute('data-link');
                if (typeof GM_setClipboard !== 'undefined') {
                    GM_setClipboard(link);
                    showToast('链接已复制到剪贴板');
                } else {
                    // 降级方案
                    navigator.clipboard.writeText(link).then(() => {
                        showToast('链接已复制到剪贴板');
                    }).catch(err => {
                        showToast('复制失败，请手动复制');
                        console.error('复制失败:', err);
                    });
                }
            });
        });
    }
    
    // 获取资源类型的短名称，用于图标显示
    function getShortName(resourceType) {
        const shortNames = {
            '百度网盘': '百度',
            '阿里云盘': '阿里',
            '夸克网盘': '夸克',
            '迅雷网盘': '迅雷',
            'UC网盘': 'UC',
            '115网盘': '115',
            '天翼网盘': '天翼',
            '123网盘': '123',
            '其他网盘': '其他'
        };
        return shortNames[resourceType] || resourceType.substring(0, 2);
    }
    
    // 显示提示信息
    function showToast(message) {
        // 移除旧的toast
        const oldToast = document.getElementById('jj-search-toast');
        if (oldToast) {
            oldToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.id = 'jj-search-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 2秒后自动消失
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }

    // 判断是否为当前网盘类型的资源
    function isCurrentPanelResource(link, currentPanelType) {
        if (!currentPanelType || !link) return false;
        
        if (currentPanelType.includes('百度') && link.includes('baidu')) return true;
            if (currentPanelType.includes('阿里') && (link.includes('ali') || link.includes('alipan'))) return true;
            if (currentPanelType.includes('夸克') && link.includes('quark')) return true;
            if (currentPanelType.includes('迅雷') && link.includes('xunlei')) return true;
            if (currentPanelType.includes('UC') && link.includes('uc')) return true;
            if (currentPanelType.includes('115') && link.includes('115')) return true;
            if (currentPanelType.includes('天翼') && link.includes('189')) return true;
            if (currentPanelType.includes('123') && (link.includes('123pan') || link.includes('123912') || link.includes('123684'))) return true;
        
        return false;
    }

    // 获取资源类型
    function getResourceType(link) {
        if (link.includes('baidu')) return '百度网盘';
        if (link.includes('ali') || link.includes('alipan')) return '阿里云盘';
        if (link.includes('quark')) return '夸克网盘';
        if (link.includes('xunlei')) return '迅雷网盘';
        if (link.includes('uc')) return 'UC网盘';
        if (link.includes('115')) return '115网盘';
        if (link.includes('189')) return '天翼网盘';
        if (link.includes('123pan') || link.includes('123912') || link.includes('123684')) return '123网盘';
        return '其他网盘';
    }

    // 获取资源图标类名
    function getResourceIconClass(resourceType) {
        const iconMap = {
            '百度网盘': 'baidu',
            '阿里云盘': 'ali',
            '夸克网盘': 'quark',
            '迅雷网盘': 'xunlei',
            'UC网盘': 'uc',
            '115网盘': '115',
            '天翼网盘': 'ty',
            '123网盘': '123pan'
        };
        return iconMap[resourceType] || 'other';
    }

    // 添加样式
    function addStyles() {
        GM_addStyle(`
            /* 搜索图标样式 */
            #jj-search-icon {
                position: fixed;
                top: 50px;
                right: 20px;
                width: 50px;
                height: 50px;
                background-color: #1E90FF;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            
            #jj-search-icon:before {
                content: "🔍";
            }
            
            #jj-search-icon:hover {
                background-color: #1873CC;
                transform: scale(1.1);
            }
            
            /* 搜索容器样式 */
            #jj-search-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                max-width: 90vw;
                max-height: 80vh;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: none;
                flex-direction: column;
                animation: jj-search-fade-in 0.3s ease;
                border: 1px solid #1E90FF;
                overflow: hidden;
            }
            
            @keyframes jj-search-fade-in {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            
            /* 标题栏样式 */
            #jj-search-header {
                padding: 15px 20px;
                background: linear-gradient(135deg, #1E90FF 0%, #4169E1 100%);
                color: white;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            
            .jj-search-header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            
            .jj-search-logo {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .jj-search-name {
                font-size: 20px;
                font-weight: bold;
            }
            
            .jj-search-version {
                font-size: 12px;
                opacity: 0.8;
                background-color: rgba(255, 255, 255, 0.2);
                padding: 2px 8px;
                border-radius: 10px;
            }
            
            /* 公告区域样式 */
            #jj-search-announcement {
                padding: 12px 20px;
                background-color: #FFF8E1;
                border-bottom: 1px solid #FFEB3B;
                display: flex;
                align-items: center;
            }
            
            .jj-announcement-content {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #FF9800;
                width: 100%;
            }
            
            .jj-announcement-icon {
                font-size: 16px;
                flex-shrink: 0;
            }
            
            /* 搜索框样式 */
            #jj-search-box {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                gap: 10px;
                align-items: center;
                background-color: #f9f9f9;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            #jj-search-input {
                flex: 1;
                padding: 12px 15px;
                border: 2px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                outline: none;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
                background-color: white;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            #jj-search-input:focus {
                border-color: #1E90FF;
                box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
            }
            
            #jj-search-btn {
                padding: 12px 24px;
                background-color: #1E90FF;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.3s ease, transform 0.1s ease;
                font-weight: 500;
                position: relative;
                overflow: hidden;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            #jj-search-btn:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: all 0.5s;
            }
            
            #jj-search-btn:hover:before {
                left: 100%;
            }
            
            #jj-search-btn:hover {
                background-color: #1873CC;
            }
            
            #jj-search-btn:active {
                transform: scale(0.98);
            }
            
            #jj-search-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: white;
                padding: 5px;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.3s ease, color 0.3s ease;
            }
            
            #jj-search-close:hover {
                background-color: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            /* 搜索结果样式 */
            #jj-search-results {
                flex: 1;
                overflow-x: hidden;
                overflow-y: auto;
                max-height: calc(80vh - 200px);
                padding: 10px 15px 30px 15px;
                position: relative;
                z-index: 1;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform-style: preserve-3d;
                perspective: 1000px;
            }
            
            /* 自定义滚动条 */
            #jj-search-results::-webkit-scrollbar {
                width: 8px;
            }
            
            #jj-search-results::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            #jj-search-results::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            
            #jj-search-results::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            
            /* 空状态和错误状态样式 */
            .jj-search-empty,
            .jj-search-error {
                background-color: #f8f9fa;
                border-radius: 6px;
                border: 1px solid #e9ecef;
                text-align: center;
            }
            
            .jj-search-results-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow: hidden;
            }
            
            .jj-search-result-item {
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 6px;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.3s ease;
                background-color: white;
                position: relative;
                overflow: hidden;
            }
            
            .jj-search-result-item:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background-color: #1E90FF;
                transform: scaleY(0);
                transition: transform 0.3s ease;
            }
            
            .jj-search-result-item:hover:before {
                transform: scaleY(1);
            }
            
            .jj-search-result-item:hover {
                background-color: #f9f9f9;
                border-color: #ddd;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            .jj-search-result-icon {
                width: 48px;
                height: 48px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                min-width: 48px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                background-color: #666; /* 默认背景色，避免使用白色 */
            }
            
            .jj-search-result-icon.baidu { background-color: #2382e2; }
            .jj-search-result-icon.ali { background-color: #ff6a00; }
            .jj-search-result-icon.quark { background-color: #00a0e9; }
            .jj-search-result-icon.xunlei { background-color: #e60012; }
            .jj-search-result-icon.uc { background-color: #0084ff; }
            .jj-search-result-icon.115 { background-color: #faad14; }
            .jj-search-result-icon.ty { background-color: #1E90FF; color: white; border: none; }
            .jj-search-result-icon.123pan { background-color: #0078d7; } /* 确保123云盘图标不使用白色背景 */
            .jj-search-result-icon.other { background-color: #666; }
            
            .jj-search-result-info {
                flex: 1;
                min-width: 0;
            }
            
            .jj-search-result-name {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.4;
                color: #333;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            .jj-search-result-meta {
                font-size: 12px;
                color: #666;
                display: flex;
                gap: 15px;
                line-height: 1.3;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            .jj-search-result-actions {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .jj-search-result-link {
                padding: 8px 16px;
                background-color: #1E90FF;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 14px;
                transition: background-color 0.3s ease;
                font-weight: 500;
                position: relative;
                overflow: hidden;
            }
            
            .jj-search-result-link:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: all 0.5s;
            }
            
            .jj-search-result-link:hover:before {
                left: 100%;
            }
            
            .jj-search-result-link:hover {
                background-color: #1873CC;
                color: white;
            }
            
            .jj-search-result-copy {
                padding: 8px 16px;
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-weight: 500;
                position: relative;
                overflow: hidden;
            }
            
            .jj-search-result-copy:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: all 0.5s;
            }
            
            .jj-search-result-copy:hover:before {
                left: 100%;
            }
            
            .jj-search-result-copy:hover {
                background-color: #1976D2;
            }
            

            
            /* 分页样式 */
            .jj-search-pagination {
                padding: 15px 15px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                background-color: #f9f9f9;
                flex-wrap: wrap;
                box-sizing: border-box;
                position: relative;
                z-index: 10;
                width: 100%;
                overflow: visible;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
            }
            
            .jj-search-pagination span {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            .jj-search-pagination button {
                padding: 8px 16px;
                background-color: white;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                position: relative;
                z-index: 11;
                flex-shrink: 0;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
                text-shadow: none;
                transform: translateZ(0);
            }
            
            .jj-search-pagination button:hover:not(:disabled) {
                background-color: #ADD8E6;
                border-color: #1E90FF;
                color: #1E90FF;
            }
            
            .jj-search-pagination button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background-color: #ADD8E6;
            }
            
            /* Toast提示样式 */
            #jj-search-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(30, 144, 255, 0.9);
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10001;
                animation: jj-search-toast-fade-in 0.3s ease;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            @keyframes jj-search-toast-fade-in {
                from { opacity: 0; transform: translate(-50%, -20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
            
            #jj-search-toast.fade-out {
                animation: jj-search-toast-fade-out 0.3s ease;
            }
            
            @keyframes jj-search-toast-fade-out {
                from { opacity: 1; transform: translate(-50%, 0); }
                to { opacity: 0; transform: translate(-50%, -20px); }
            }
            

        
            /* 响应式设计优化 - 解决小屏幕字体重影问题 */
            @media (max-width: 768px) {
                #jj-search-container {
                    width: 95vw;
                    max-width: 95vw;
                    max-height: 90vh;
                    transform: translate(-50%, -50%) translateZ(0);
                    backface-visibility: hidden;
                    will-change: transform;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: geometricPrecision;
                    text-shadow: none;
                    transform-style: preserve-3d;
                    perspective: 1000px;
                }
                
                #jj-search-input,
                #jj-search-btn,
                .jj-search-result-name,
                .jj-search-result-meta,
                .jj-search-pagination span,
                .jj-search-pagination button {
                    will-change: transform;
                    text-shadow: none;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: geometricPrecision;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                    transform: translateZ(0);
                }
                
                #jj-search-results {
                    max-height: calc(90vh - 200px);
                }
                
                .jj-search-result-item {
                    padding: 12px;
                    gap: 10px;
                }
                
                .jj-search-result-icon {
                    width: 40px;
                    height: 40px;
                    min-width: 40px;
                    font-size: 13px;
                }
                
                .jj-search-result-name {
                    font-size: 13px;
                    line-height: 1.3;
                    font-weight: 600;
                }
                
                .jj-search-result-meta {
                    font-size: 11px;
                    gap: 10px;
                    font-weight: 500;
                }
                
                .jj-search-result-actions {
                    gap: 8px;
                }
                
                .jj-search-result-link,
                .jj-search-result-copy {
                    padding: 6px 12px;
                    font-size: 13px;
                }
                
                #jj-search-box {
                    padding: 15px;
                }
                
                #jj-search-input {
                    font-size: 15px;
                }
                
                #jj-search-btn {
                    font-size: 15px;
                }
            }
            
            @media (max-width: 480px) {
                .jj-search-result-name {
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .jj-search-result-meta {
                    font-size: 10px;
                    flex-direction: column;
                    gap: 4px;
                    font-weight: 500;
                }
                
                .jj-search-result-actions {
                    flex-direction: column;
                    gap: 6px;
                }
                
                .jj-search-result-link,
                .jj-search-result-copy {
                    font-size: 12px;
                    padding: 5px 10px;
                }
            }
        `);
    }

    // 初始化
    function init() {
        addStyles();
        createSearchUI();
        createSearchIcon();
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();