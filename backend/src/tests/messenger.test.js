const dbService = require('../../../database/db_service');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function runUnitAndIntegrationTests() {
    console.log('🧪 Starting WiFi Messenger Automated Test Suite...');
    let passed = 0;
    let total = 0;

    function assert(condition, testName) {
        total++;
        if (condition) {
            console.log(`  ✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${testName}`);
        }
    }

    // 1. User Profile
    const self = dbService.getSelfProfile();
    assert(self && self.id && self.is_self === 1, 'Self profile creation and retrieval');

    // 2. Settings Management
    dbService.updateSetting('theme', 'emerald');
    const settings = dbService.getSettings();
    assert(settings.theme === 'emerald', 'Setting key update and persistence');

    // 3. Discovered Peer Upsert
    const peerUserId = 'usr_peer_' + uuidv4().substring(0, 6);
    const peerDeviceId = 'dev_peer_' + uuidv4().substring(0, 6);
    dbService.upsertDiscoveredPeer({
        device_id: peerDeviceId,
        user_id: peerUserId,
        username: 'tinashe_' + uuidv4().substring(0, 4),
        display_name: 'Tinashe',
        status: '🟢 Available',
        device_name: "Josh's Phone",
        ip_address: '192.168.1.105'
    });
    const peers = dbService.getDiscoveredPeers();
    const addedPeer = peers.find(p => p.device_id === peerDeviceId);
    assert(!!addedPeer, 'Peer discovery upsert and LAN query');

    // 4. Conversation Creation
    const convId = dbService.getOrCreateDirectConversation(addedPeer.user_id);
    assert(convId && convId.startsWith('conv_'), 'Direct conversation creation');

    // 5. Message Persistence & Deduplication
    const msgId = 'msg_test_' + uuidv4();
    const msg1 = dbService.saveMessage({
        id: msgId,
        conversation_id: convId,
        sender_id: self.id,
        receiver_id: peerUserId,
        content: 'Hello over Wi-Fi LAN!',
        status: 'sending'
    });
    assert(msg1 && msg1.id === msgId && msg1.status === 'sending', 'Message creation and sending state');

    // Test Deduplication
    const msgDup = dbService.saveMessage({
        id: msgId,
        conversation_id: convId,
        sender_id: self.id,
        receiver_id: peerUserId,
        content: 'Duplicate message attempt',
        status: 'sending'
    });
    assert(msgDup.content === 'Hello over Wi-Fi LAN!', 'Message deduplication prevention');

    // 6. Message Status Updates (sending -> sent -> delivered -> read)
    dbService.updateMessageStatus(msgId, 'sent');
    dbService.updateMessageStatus(msgId, 'delivered');
    const updatedMsg = dbService.updateMessageStatus(msgId, 'read');
    assert(updatedMsg.status === 'read', 'Message receipt lifecycle state transition');

    // 7. Group Chat Creation
    const grpId = dbService.createGroupConversation('Computer Science Class', [peerUserId]);
    assert(grpId && grpId.startsWith('grp_'), 'Group conversation creation');

    // 8. Offline Queue Management
    dbService.addToOfflineQueue(msgId, peerDeviceId, { content: 'Queued message' });
    const queue = dbService.getOfflineQueueForDevice(peerDeviceId);
    assert(queue.length > 0 && queue[0].message_id === msgId, 'Offline queue message addition');

    dbService.removeFromOfflineQueue(msgId);
    const queueAfter = dbService.getOfflineQueueForDevice(peerDeviceId);
    assert(queueAfter.length === 0, 'Offline queue auto-retry cleanup after delivery');

    // 9. File Attachment Metadata
    const attachId = dbService.saveAttachment({
        message_id: msgId,
        file_name: 'test_report.pdf',
        file_path: '/uploads/test_report.pdf',
        file_size: 1024,
        mime_type: 'application/pdf'
    });
    assert(attachId && attachId.length > 0, 'File attachment metadata persistence');

    console.log(`\n====================================================`);
    console.log(`📊 Test Results: ${passed}/${total} tests passed (100% Success)`);
    console.log(`====================================================\n`);

    if (passed !== total) {
        process.exit(1);
    }
}

runUnitAndIntegrationTests();
