import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Helper to sanitize gradient strings to solid hex colors for React Native views
const getSolidColor = (colorOrGrad) => {
  if (!colorOrGrad) return '#6366f1';
  if (colorOrGrad.startsWith('#') || colorOrGrad.startsWith('rgb')) {
    return colorOrGrad;
  }
  // Extract first hex color from linear-gradient string if present
  const match = colorOrGrad.match(/#[a-fA-F0-9]{6}/);
  return match ? match[0] : '#6366f1';
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:6070/api';

export default function App() {
  const [chats, setChats] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  // Status Posting Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('#6366f1');

  // Status Story Viewer
  const [viewingStatus, setViewingStatus] = useState(null);

  useEffect(() => {
    fetchChats();
    fetchStatuses();
  }, []);

  useEffect(() => {
    let timer;
    if (activeChat) {
      fetchMessages(activeChat.chatId);
      timer = setInterval(() => fetchMessages(activeChat.chatId), 3000);
    }
    return () => clearInterval(timer);
  }, [activeChat]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE}/link_chats`);
      const data = await res.json();
      setChats(data);
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
      }
    } catch (e) {
      console.log('Error fetching chats:', e);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetch(`${API_BASE}/link_statuses`);
      const data = await res.json();
      setStatuses(data);
    } catch (e) {
      console.log('Error fetching statuses:', e);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE}/link_messages?chatId=${chatId}`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.log('Error fetching messages:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    const text = messageText.trim();
    setMessageText('');

    try {
      await fetch(`${API_BASE}/link_messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChat.chatId,
          senderId: 'admin',
          senderName: 'System Administrator',
          content: text
        })
      });
      fetchMessages(activeChat.chatId);
      fetchChats();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleCreateStatus = async () => {
    if (!statusText.trim()) return;
    try {
      await fetch(`${API_BASE}/link_statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          userName: 'System Administrator',
          userAvatar: '⚡',
          content: statusText,
          bgGradient: selectedGradient
        })
      });
      setStatusText('');
      setStatusModalVisible(false);
      fetchStatuses();
    } catch (e) {
      Alert.alert('Error', 'Failed to post status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandLogo}>⚡</Text>
          <Text style={styles.brandTitle}>Link Messenger</Text>
        </View>
        <TouchableOpacity
          style={styles.postStatusBtn}
          onPress={() => setStatusModalVisible(true)}
        >
          <Text style={styles.postStatusText}>+ Status</Text>
        </TouchableOpacity>
      </View>

      {/* Top Status Story Tray */}
      <View style={styles.statusTrayContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusTray}>
          <TouchableOpacity style={styles.myStatusItem} onPress={() => setStatusModalVisible(true)}>
            <View style={styles.myStatusAddCircle}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={styles.statusLabel}>Add Status</Text>
          </TouchableOpacity>

          {statuses.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.statusItem}
              onPress={() => setViewingStatus(item)}
            >
              <View style={[styles.statusRing, { borderColor: getSolidColor(item.bgGradient) }]}>
                <Text style={styles.statusAvatar}>{item.userAvatar || '👤'}</Text>
              </View>
              <Text style={styles.statusLabel} numberOfLines={1}>{item.userName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat List / Message Stream Workspace */}
      <View style={styles.mainWorkspace}>
        {/* Chat Selector Horizontal Pills */}
        <View style={styles.chatPickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chats.map((c) => {
              const selected = activeChat && activeChat.chatId === c.chatId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chatPill, selected && styles.chatPillActive]}
                  onPress={() => setActiveChat(c)}
                >
                  <Text style={[styles.chatPillText, selected && styles.chatPillTextActive]}>
                    {c.type === 'group' ? '👥 ' : '💬 '}{c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Chat Conversation Stream */}
        {activeChat ? (
          <View style={styles.chatWindow}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>{activeChat.name}</Text>
              <Text style={styles.chatHeaderSub}>Active now</Text>
            </View>

            <FlatList
              data={messages}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => {
                const isMe = item.senderId === 'admin';
                return (
                  <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                    <Text style={styles.msgSender}>{item.senderName}</Text>
                    <View style={[styles.msgBubble, isMe ? styles.msgBubbleSent : styles.msgBubbleReceived]}>
                      <Text style={styles.msgText}>{item.content}</Text>
                    </View>
                  </View>
                );
              }}
            />

            {/* Chat Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Type an instant message..."
                placeholderTextColor="#94a3b8"
                value={messageText}
                onChangeText={setMessageText}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Text style={styles.sendButtonText}>Send 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Select or start a chat</Text>
          </View>
        )}
      </View>

      {/* Status Composer Modal */}
      <Modal visible={statusModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✨ Share a Status Post</Text>
            <Text style={styles.modalSubtitle}>Disappears automatically after 24 hours.</Text>

            <View style={[styles.previewCard, { backgroundColor: getSolidColor(selectedGradient) }]}>
              <Text style={styles.previewText}>{statusText || 'Type your status thoughts...'}</Text>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?..."
              placeholderTextColor="#94a3b8"
              multiline
              value={statusText}
              onChangeText={setStatusText}
            />

            {/* Gradient / Solid Color Picker */}
            <View style={styles.gradientRow}>
              {['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }, selectedGradient === color && styles.colorCircleActive]}
                  onPress={() => setSelectedGradient(color)}
                />
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPost]} onPress={handleCreateStatus}>
                <Text style={styles.modalBtnText}>Post Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setStatusModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Viewing Story Modal */}
      {viewingStatus && (
        <Modal visible={!!viewingStatus} animationType="fade" transparent>
          <View style={[styles.storyFullscreen, { backgroundColor: getSolidColor(viewingStatus.bgGradient) }]}>
            <SafeAreaView style={{ flex: 1, padding: 20 }}>
              <TouchableOpacity style={styles.closeStoryBtn} onPress={() => setViewingStatus(null)}>
                <Text style={styles.closeStoryText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.storyHeader}>
                <Text style={styles.storyAvatar}>{viewingStatus.userAvatar || '👤'}</Text>
                <Text style={styles.storyUser}>{viewingStatus.userName}</Text>
              </View>

              <View style={styles.storyBody}>
                <Text style={styles.storyContent}>"{viewingStatus.content}"</Text>
              </View>

              <Text style={styles.storyFooter}>Expires in 24 hours</Text>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e'
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandLogo: {
    fontSize: 24,
    marginRight: 8
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff'
  },
  postStatusBtn: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  postStatusText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  statusTrayContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  statusTray: {
    paddingHorizontal: 15,
    alignItems: 'center'
  },
  myStatusItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 65
  },
  myStatusAddCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  addPlus: {
    color: '#6366f1',
    fontSize: 24,
    fontWeight: '700'
  },
  statusItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 65
  },
  statusRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0f1e',
    marginBottom: 4
  },
  statusAvatar: {
    fontSize: 22
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center'
  },
  mainWorkspace: {
    flex: 1
  },
  chatPickerContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15
  },
  chatPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  chatPillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8'
  },
  chatPillText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13
  },
  chatPillTextActive: {
    color: '#ffffff'
  },
  chatWindow: {
    flex: 1,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(15,22,45,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  chatHeader: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  chatHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  chatHeaderSub: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600'
  },
  messageList: {
    padding: 12
  },
  msgRow: {
    marginBottom: 12,
    maxWidth: '80%'
  },
  msgRowLeft: {
    alignSelf: 'flex-start'
  },
  msgRowRight: {
    alignSelf: 'flex-end'
  },
  msgSender: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16
  },
  msgBubbleSent: {
    backgroundColor: '#6366f1'
  },
  msgBubbleReceived: {
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  msgText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 21,
    paddingHorizontal: 16,
    color: '#ffffff',
    marginRight: 8
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 21
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#94a3b8'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0a0f1e',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6366f1'
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15
  },
  previewCard: {
    height: 120,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 15
  },
  previewText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center'
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 15
  },
  gradientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalBtnPost: {
    backgroundColor: '#ec4899'
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  modalBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  modalBtnCancelText: {
    color: '#94a3b8'
  },
  storyFullscreen: {
    flex: 1
  },
  closeStoryBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeStoryText: {
    color: '#ffffff',
    fontSize: 18
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20
  },
  storyAvatar: {
    fontSize: 28,
    marginRight: 10
  },
  storyUser: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  storyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  storyContent: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center'
  },
  storyFooter: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20
  }
});
