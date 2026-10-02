// WiFi Messenger Frontend Logic
// Developed by JoshWebs

let state = {
    activeTab: 'dashboard',
    selfProfile: null,
    peers: [],
    conversations: [],
    activeConversation: null,
    messages: [],
    ws: null,
    settings: { theme: 'default', color_mode: 'dark' },
    networkStatus: 'lan_connected' // 'lan_connected', 'offline_lan', 'internet_connected', 'disconnected'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupTabNavigation();
    setupSearch();
    await fetchProfileAndSettings();
    await fetchPeersAndConversations();
    connectWebSocket();
    renderMainContent();
}

function setupTabNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeTab = tab.dataset.tab;
            renderSidebarList();
            renderMainContent();
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderSidebarList(query);
        });
    }
}

async function fetchProfileAndSettings() {
    try {
        const [profRes, setRes] = await Promise.all([
            fetch('/api/profile').then(r => r.json()),
            fetch('/api/settings').then(r => r.json())
        ]);
        if (profRes.success) state.selfProfile = profRes.data;
        if (setRes.success) {
            state.settings = setRes.data;
            applyTheme(state.settings.theme);
        }
    } catch (e) {
        console.error('Failed to load profile/settings:', e);
    }
}

async function fetchPeersAndConversations() {
    try {
        const [peersRes, convsRes] = await Promise.all([
            fetch('/api/peers').then(r => r.json()),
            fetch('/api/conversations').then(r => r.json())
        ]);
        if (peersRes.success) state.peers = peersRes.data;
        if (convsRes.success) state.conversations = convsRes.data;
        renderSidebarList();
    } catch (e) {
        console.error('Failed to load peers/conversations:', e);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'default');
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
        updateNetworkStatus('lan_connected', '🟢 Local Network Connected');
        if (state.selfProfile) {
            state.ws.send(JSON.stringify({
                type: 'register',
                payload: {
                    device_id: state.selfProfile.device_id,
                    user_id: state.selfProfile.id,
                    username: state.selfProfile.username,
                    display_name: state.selfProfile.display_name,
                    device_name: state.selfProfile.device_name,
                    status: state.selfProfile.status
                }
            }));
        }
    };

    state.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWSMessage(data);
    };

    state.ws.onclose = () => {
        updateNetworkStatus('offline_lan', '🟢 Offline LAN Mode');
        setTimeout(connectWebSocket, 3000); // Auto reconnect
    };

    state.ws.onerror = () => {
        updateNetworkStatus('disconnected', '🔴 LAN Disconnected');
    };
}

function updateNetworkStatus(statusKey, label) {
    state.networkStatus = statusKey;
    const badge = document.getElementById('network-badge');
    const text = document.getElementById('network-status-text');
    if (badge && text) {
        text.innerText = label;
        badge.className = `network-badge ${statusKey}`;
    }
}

function handleWSMessage(data) {
    switch (data.type) {
        case 'peer_online':
        case 'peer_offline':
            fetchPeersAndConversations();
            break;

        case 'new_message':
            if (state.activeConversation && state.activeConversation.id === data.payload.conversation_id) {
                state.messages.push(data.payload);
                renderChatMessages();

                // Send read status ACK if active
                state.ws.send(JSON.stringify({
                    type: 'message_read',
                    payload: {
                        message_id: data.payload.id,
                        conversation_id: data.payload.conversation_id,
                        sender_device_id: data.payload.sender_device_id
                    }
                }));
            }
            fetchPeersAndConversations();
            break;

        case 'message_status_update':
        case 'message_ack':
            if (state.activeConversation) {
                const msg = state.messages.find(m => m.id === data.payload.message_id);
                if (msg) {
                    msg.status = data.payload.status;
                    renderChatMessages();
                }
            }
            break;
    }
}

function renderSidebarList(filter = '') {
    const container = document.getElementById('sidebar-list');
    if (!container) return;
    container.innerHTML = '';

    if (state.activeTab === 'chats' || state.activeTab === 'dashboard') {
        const convs = state.conversations.filter(c => {
            const name = c.type === 'direct' ? (c.peer ? c.peer.display_name : '') : c.title;
            return name.toLowerCase().includes(filter);
        });

        convs.forEach(c => {
            const title = c.type === 'direct' ? (c.peer ? c.peer.display_name : 'Direct Chat') : (c.title || 'Group Chat');
            const sub = c.last_message || 'No messages yet';
            const card = document.createElement('div');
            card.className = `item-card ${state.activeConversation && state.activeConversation.id === c.id ? 'active' : ''}`;
            card.innerHTML = `
                <div class="avatar">
                    ${title.substring(0, 1).toUpperCase()}
                    <div class="status-dot"></div>
                </div>
                <div class="item-info">
                    <div class="item-title">
                        <span>${title}</span>
                    </div>
                    <div class="item-sub">${sub}</div>
                </div>
            `;
            card.onclick = () => selectConversation(c);
            container.appendChild(card);
        });
    } else if (state.activeTab === 'peers') {
        const peers = state.peers.filter(p => p.display_name.toLowerCase().includes(filter) || p.username.toLowerCase().includes(filter));
        peers.forEach(p => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="avatar">
                    ${p.display_name.substring(0, 1).toUpperCase()}
                    <div class="status-dot"></div>
                </div>
                <div class="item-info">
                    <div class="item-title">${p.display_name}</div>
                    <div class="item-sub">${p.device_name} &bull; ${p.ip_address || 'LAN'}</div>
                </div>
            `;
            card.onclick = () => startDirectChatWithPeer(p);
            container.appendChild(card);
        });
    }
}

async function selectConversation(conversation) {
    state.activeConversation = conversation;
    state.activeTab = 'chats';
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'chats'));
    renderSidebarList();

    try {
        const res = await fetch(`/api/conversations/${conversation.id}/messages`).then(r => r.json());
        if (res.success) {
            state.messages = res.data;
            renderMainContent();
        }
    } catch (e) {
        console.error('Failed to load messages:', e);
    }
}

async function startDirectChatWithPeer(peer) {
    try {
        const res = await fetch('/api/conversations/direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peer_user_id: peer.user_id })
        }).then(r => r.json());

        if (res.success) {
            await fetchPeersAndConversations();
            const conv = state.conversations.find(c => c.id === res.conversation_id);
            if (conv) selectConversation(conv);
        }
    } catch (e) {
        console.error('Failed to start chat:', e);
    }
}

function renderMainContent() {
    const container = document.getElementById('main-content');
    if (!container) return;

    if (state.activeTab === 'dashboard') {
        renderDashboard(container);
    } else if (state.activeTab === 'chats' && state.activeConversation) {
        renderChatWindow(container);
    } else if (state.activeTab === 'settings') {
        renderSettings(container);
    } else {
        container.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 12px;">
                <div style="font-size: 3rem;">💬</div>
                <h2>WiFi Messenger</h2>
                <p>Select a peer or conversation from the sidebar to start messaging over LAN.</p>
                <div style="font-size: 0.85rem; margin-top: 10px;">Developed by JoshWebs</div>
            </div>
        `;
    }
}

function renderDashboard(container) {
    const nearbyCount = state.peers.length;
    const activeChatsCount = state.conversations.length;
    const pendingMsgCount = state.messages.filter(m => m.status === 'pending').length;

    container.innerHTML = `
        <div class="dashboard-view">
            <div class="stat-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));">
                <h2 style="font-size: 1.5rem;">Good day, ${state.selfProfile ? state.selfProfile.display_name : 'User'} 👋</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">
                    🟢 Local Network Active &bull; Offline LAN Mode Enabled
                </p>
                <div style="font-size: 0.8rem; color: var(--accent-primary); margin-top: 4px;">
                    Device ID: <code>${state.selfProfile ? state.selfProfile.device_id : ''}</code>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-value">📱 ${nearbyCount}</div>
                <div class="stat-label">Nearby LAN Devices</div>
            </div>

            <div class="stat-card">
                <div class="stat-value">💬 ${activeChatsCount}</div>
                <div class="stat-label">Active Conversations</div>
            </div>

            <div class="stat-card">
                <div class="stat-value">⏳ ${pendingMsgCount}</div>
                <div class="stat-label">Pending Messages</div>
            </div>

            <div class="stat-card" style="grid-column: 1 / -1;">
                <h3 style="margin-bottom: 12px;">Discovered LAN Peers</h3>
                ${state.peers.length === 0 ? '<p style="color: var(--text-muted);">No other devices discovered on LAN yet.</p>' : ''}
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${state.peers.map(p => `
                        <div style="padding: 10px; background: var(--bg-input); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>🟢 ${p.display_name}</strong> (${p.username})
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${p.device_name} &bull; ${p.ip_address}</div>
                            </div>
                            <button onclick="startDirectChatWithPeer({user_id: '${p.user_id}'})" style="padding: 6px 12px; background: var(--accent-primary); border: none; color: #fff; border-radius: 6px; cursor: pointer;">Chat</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderChatWindow(container) {
    const title = state.activeConversation.type === 'direct' ?
        (state.activeConversation.peer ? state.activeConversation.peer.display_name : 'Direct Chat') :
        (state.activeConversation.title || 'Group Chat');

    container.innerHTML = `
        <div class="chat-header">
            <div>
                <h3 style="font-size: 1.1rem;">${title}</h3>
                <span style="font-size: 0.8rem; color: var(--status-online);">🟢 LAN Connected</span>
            </div>
            <button onclick="showPairingModal()" style="padding: 6px 12px; background: var(--bg-card-hover); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm); cursor: pointer;">🔗 Device Pairing</button>
        </div>

        <div class="chat-messages" id="chat-messages-container">
            <!-- Messages rendered dynamically -->
        </div>

        <div class="chat-input-bar">
            <input type="file" id="file-upload-input" style="display: none;" onchange="handleFileUpload(event)">
            <button class="btn-icon" onclick="document.getElementById('file-upload-input').click()" style="background: var(--bg-card-hover); color: var(--text-primary);" title="Attach File">📎</button>
            <input type="text" class="chat-input" id="message-text-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter') sendMessage()">
            <button class="btn-icon" onclick="sendMessage()">➤</button>
        </div>
    `;

    renderChatMessages();
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    container.innerHTML = '';

    state.messages.forEach(m => {
        const isSelf = state.selfProfile && m.sender_id === state.selfProfile.id;
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isSelf ? 'sent' : 'received'}`;

        let statusIcon = '⏳';
        if (m.status === 'sent') statusIcon = '✓';
        if (m.status === 'delivered') statusIcon = '✓✓';
        if (m.status === 'read') statusIcon = '<span style="color: #38bdf8;">✓✓</span>';

        let attachmentHtml = '';
        if (m.attachments && m.attachments.length > 0) {
            m.attachments.forEach(att => {
                attachmentHtml += `
                    <div style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.85rem;">
                        📁 <a href="${att.file_path}" target="_blank" style="color: inherit; text-decoration: underline;">${att.file_name}</a> (${(att.file_size / 1024).toFixed(1)} KB)
                    </div>
                `;
            });
        }

        bubble.innerHTML = `
            <div>${m.content || ''}</div>
            ${attachmentHtml}
            <div class="message-meta">
                <span>${new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                ${isSelf ? `<span>${statusIcon}</span>` : ''}
            </div>
        `;
        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('message-text-input');
    if (!input || !input.value.trim() || !state.activeConversation) return;

    const content = input.value.trim();
    input.value = '';

    const messageId = 'msg_' + Date.now();
    const payload = {
        message_id: messageId,
        conversation_id: state.activeConversation.id,
        sender_id: state.selfProfile.id,
        receiver_id: state.activeConversation.peer ? state.activeConversation.peer.id : null,
        receiver_device_id: state.activeConversation.peer ? state.activeConversation.peer.device_id : null,
        content: content,
        message_type: 'text',
        is_group: state.activeConversation.type === 'group'
    };

    // Immediate local optimistic render
    state.messages.push({
        id: messageId,
        conversation_id: state.activeConversation.id,
        sender_id: state.selfProfile.id,
        content: content,
        status: 'sending',
        created_at: new Date().toISOString()
    });
    renderChatMessages();

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({
            type: 'send_message',
            payload: payload
        }));
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file || !state.activeConversation) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        }).then(r => r.json());

        if (uploadRes.success) {
            const content = `Shared file: ${file.name}`;
            const messageId = 'msg_' + Date.now();

            const payload = {
                message_id: messageId,
                conversation_id: state.activeConversation.id,
                sender_id: state.selfProfile.id,
                receiver_id: state.activeConversation.peer ? state.activeConversation.peer.id : null,
                receiver_device_id: state.activeConversation.peer ? state.activeConversation.peer.device_id : null,
                content: content,
                message_type: 'file',
                is_group: state.activeConversation.type === 'group'
            };

            if (state.ws && state.ws.readyState === WebSocket.OPEN) {
                state.ws.send(JSON.stringify({
                    type: 'send_message',
                    payload: payload
                }));
            }
        }
    } catch (e) {
        console.error('File upload failed:', e);
    }
}

function renderSettings(container) {
    container.innerHTML = `
        <div style="padding: 24px; max-width: 650px; display: flex; flex-direction: column; gap: 20px;">
            <h2>⚙ Application Settings</h2>

            <div class="stat-card">
                <h3>👤 Profile Information</h3>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <label>Display Name</label>
                    <input type="text" class="search-input" id="set-display-name" value="${state.selfProfile ? state.selfProfile.display_name : ''}">
                    <label>Status Message</label>
                    <input type="text" class="search-input" id="set-status" value="${state.selfProfile ? state.selfProfile.status : ''}">
                    <button onclick="saveProfileSettings()" style="padding: 8px 16px; background: var(--accent-primary); color: #fff; border: none; border-radius: var(--radius-sm); cursor: pointer; align-self: flex-start;">Save Profile</button>
                </div>
            </div>

            <div class="stat-card">
                <h3>🎨 Appearance & Theme</h3>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="changeTheme('default')" style="padding: 10px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Default</button>
                    <button onclick="changeTheme('dark')" style="padding: 10px 16px; background: #111827; color: #fff; border: 1px solid #374151; border-radius: 6px; cursor: pointer;">Dark</button>
                    <button onclick="changeTheme('emerald')" style="padding: 10px 16px; background: #059669; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Emerald</button>
                    <button onclick="changeTheme('ocean')" style="padding: 10px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Ocean</button>
                    <button onclick="changeTheme('sunset')" style="padding: 10px 16px; background: #e11d48; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Sunset</button>
                </div>
            </div>

            <div class="stat-card">
                <h3>🌐 Render Cloud Sync</h3>
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 6px 0;">Optional cloud backup when Internet connectivity is available.</p>
                <button onclick="triggerCloudSync()" style="padding: 8px 16px; background: var(--bg-card-hover); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm); cursor: pointer; align-self: flex-start;">Sync with Render Cloud</button>
            </div>
        </div>
    `;
}

async function saveProfileSettings() {
    const name = document.getElementById('set-display-name').value;
    const status = document.getElementById('set-status').value;
    try {
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: name, status: status })
        }).then(r => r.json());

        if (res.success) {
            state.selfProfile = res.data;
            alert('Profile updated successfully!');
        }
    } catch (e) {
        console.error('Failed to update profile:', e);
    }
}

async function changeTheme(themeKey) {
    applyTheme(themeKey);
    state.settings.theme = themeKey;
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'theme', value: themeKey })
        });
    } catch (e) {
        console.error('Failed to save theme:', e);
    }
}

async function triggerCloudSync() {
    try {
        const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_timestamp: new Date().toISOString() })
        }).then(r => r.json());

        if (res.success) {
            alert('Sync complete: ' + res.message);
        }
    } catch (e) {
        alert('Offline LAN Mode active — Cloud sync skipped.');
    }
}

async function showPairingModal() {
    try {
        const res = await fetch('/api/pairing/qrcode').then(r => r.json());
        if (res.success) {
            alert(`Device Pairing Code: ${res.pairing_code}\nShare this code with nearby device to establish trusted pair.`);
        }
    } catch (e) {
        console.error('Pairing error:', e);
    }
}
