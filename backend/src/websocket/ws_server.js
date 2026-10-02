const WebSocket = require('ws');
const dbService = require('../../../database/db_service');

const activeConnections = new Map(); // device_id -> WebSocket connection

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        let authenticatedDeviceId = null;

        ws.on('message', (messageStr) => {
            try {
                const data = JSON.parse(messageStr);
                const { type, payload } = data;

                switch (type) {
                    case 'register': {
                        const { device_id, user_id, username, display_name, device_name, status } = payload;
                        authenticatedDeviceId = device_id;
                        activeConnections.set(device_id, ws);

                        // Update or insert peer info in database
                        const ipAddress = req.socket.remoteAddress ? req.socket.remoteAddress.replace(/^.*:/, '') : '127.0.0.1';
                        dbService.upsertDiscoveredPeer({
                            device_id,
                            user_id,
                            username,
                            display_name,
                            device_name,
                            status,
                            ip_address: ipAddress
                        });

                        ws.send(JSON.stringify({
                            type: 'registered',
                            payload: { status: 'success', device_id }
                        }));

                        // Process offline queue for this device
                        processOfflineQueueForDevice(device_id, ws);

                        // Broadcast discovery status to other connected clients
                        broadcastToOthers(device_id, {
                            type: 'peer_online',
                            payload: { device_id, user_id, username, display_name, status, device_name, ip_address: ipAddress }
                        });
                        break;
                    }

                    case 'send_message': {
                        const { conversation_id, sender_id, receiver_id, receiver_device_id, content, message_type, message_id, parent_id } = payload;

                        // 1. Save message locally with status 'sending'
                        const savedMessage = dbService.saveMessage({
                            id: message_id,
                            conversation_id,
                            sender_id,
                            receiver_id,
                            content,
                            message_type: message_type || 'text',
                            status: 'sending',
                            parent_id
                        });

                        // 2. Acknowledge message received by local server
                        ws.send(JSON.stringify({
                            type: 'message_ack',
                            payload: { message_id: savedMessage.id, status: 'sent', conversation_id }
                        }));
                        dbService.updateMessageStatus(savedMessage.id, 'sent');

                        // 3. Attempt delivery if target device is connected on LAN
                        if (receiver_device_id && activeConnections.has(receiver_device_id)) {
                            const recipientWs = activeConnections.get(receiver_device_id);
                            if (recipientWs.readyState === WebSocket.OPEN) {
                                recipientWs.send(JSON.stringify({
                                    type: 'new_message',
                                    payload: { ...savedMessage, status: 'delivered' }
                                }));

                                // Mark as delivered locally and notify sender
                                dbService.updateMessageStatus(savedMessage.id, 'delivered');
                                ws.send(JSON.stringify({
                                    type: 'message_status_update',
                                    payload: { message_id: savedMessage.id, status: 'delivered', conversation_id }
                                }));
                            } else {
                                // Add to offline queue
                                dbService.addToOfflineQueue(savedMessage.id, receiver_device_id, savedMessage);
                            }
                        } else if (receiver_device_id) {
                            // Queue for offline delivery
                            dbService.addToOfflineQueue(savedMessage.id, receiver_device_id, savedMessage);
                        } else if (payload.is_group) {
                            // Broadcast to group members
                            broadcastGroupMessage(conversation_id, sender_id, savedMessage);
                        }
                        break;
                    }

                    case 'message_read': {
                        const { message_id, conversation_id, sender_device_id } = payload;
                        dbService.updateMessageStatus(message_id, 'read');

                        if (sender_device_id && activeConnections.has(sender_device_id)) {
                            const senderWs = activeConnections.get(sender_device_id);
                            if (senderWs.readyState === WebSocket.OPEN) {
                                senderWs.send(JSON.stringify({
                                    type: 'message_status_update',
                                    payload: { message_id, status: 'read', conversation_id }
                                }));
                            }
                        }
                        break;
                    }

                    case 'ping': {
                        ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
                        break;
                    }

                    default:
                        console.log('Unknown WS message type:', type);
                }
            } catch (err) {
                console.error('Error handling WebSocket message:', err.message);
            }
        });

        ws.on('close', () => {
            if (authenticatedDeviceId) {
                activeConnections.delete(authenticatedDeviceId);
                broadcastToOthers(authenticatedDeviceId, {
                    type: 'peer_offline',
                    payload: { device_id: authenticatedDeviceId }
                });
            }
        });
    });

    console.log('WebSocket Server initialized at /ws');
}

function processOfflineQueueForDevice(deviceId, recipientWs) {
    const queuedItems = dbService.getOfflineQueueForDevice(deviceId);
    queuedItems.forEach(item => {
        try {
            const messageObj = JSON.parse(item.payload);
            recipientWs.send(JSON.stringify({
                type: 'new_message',
                payload: { ...messageObj, status: 'delivered' }
            }));
            dbService.updateMessageStatus(item.message_id, 'delivered');
            dbService.removeFromOfflineQueue(item.message_id);
        } catch (e) {
            console.error('Failed to process queued message:', e.message);
        }
    });
}

function broadcastToOthers(excludeDeviceId, messageObj) {
    const messageStr = JSON.stringify(messageObj);
    activeConnections.forEach((ws, devId) => {
        if (devId !== excludeDeviceId && ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

function broadcastGroupMessage(conversationId, senderId, message) {
    // Send to all connected sockets
    const messageStr = JSON.stringify({
        type: 'new_message',
        payload: { ...message, conversation_id: conversationId }
    });
    activeConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

module.exports = { setupWebSocketServer, activeConnections };
