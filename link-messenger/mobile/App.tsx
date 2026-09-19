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

// Helper to sanitize color strings for React Native views
const getSolidColor = (colorOrGrad) => {
  if (!colorOrGrad) return '#6366f1';
  if (colorOrGrad.startsWith('#') || colorOrGrad.startsWith('rgb')) {
    return colorOrGrad;
  }
  const match = colorOrGrad.match(/#[a-fA-F0-9]{6}/);
  return match ? match[0] : '#6366f1';
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:6070/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  // Modals visibility
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [groupMembersModalVisible, setGroupMembersModalVisible] = useState(false);

  // Forms state
  const [statusText, setStatusText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupMembersList, setGroupMembersList] = useState([]);

  // Viewing status
  const [viewingStatus, setViewingStatus] = useState(null);

  useEffect(() => {
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/link_users`);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.log('Error fetching users:', e);
    }
  };

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

  const fetchGroupMembers = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE}/link_chats/${chatId}/members`);
      const data = await res.json();
      setGroupMembersList(data);
    } catch (e) {
      console.log('Error fetching members:', e);
    }
  };

  const handleStartDirectChat = async (targetUser) => {
    try {
      const res = await fetch(`${API_BASE}/link_chats/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: 'admin',
          targetUserId: targetUser.userId
        })
      });
      const newChat = await res.json();
      setNewChatModalVisible(false);
      await fetchChats();
      setActiveChat(newChat);
    } catch (e) {
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      Alert.alert('Group Error', 'Please enter a group name and select at least 1 member');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/link_chats/group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          creatorId: 'admin',
          participantIds: selectedMembers
        })
      });
      const newGroup = await res.json();
      setGroupName('');
      setSelectedMembers([]);
      setCreateGroupModalVisible(false);
      await fetchChats();
      setActiveChat(newGroup);
    } catch (e) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleAddMembersToGroup = async (userToAdd) => {
    if (!activeChat) return;
    try {
      await fetch(`${API_BASE}/link_chats/${activeChat.chatId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newParticipantIds: [userToAdd.userId]
        })
      });
      fetchGroupMembers(activeChat.chatId);
      fetchMessages(activeChat.chatId);
      Alert.alert('Member Added', `${userToAdd.name} was added to the group!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add member');
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
          bgGradient: selectedColor
        })
      });
      setStatusText('');
      setStatusModalVisible(false);
      fetchStatuses();
    } catch (e) {
      Alert.alert('Error', 'Failed to post status');
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandLogo}>⚡</Text>
          <Text style={styles.brandTitle}>Link Messenger</Text>
        </View>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity style={styles.newChatHeaderBtn} onPress={() => setNewChatModalVisible(true)}>
            <Text style={styles.headerBtnText}>💬 Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newGroupHeaderBtn} onPress={() => setCreateGroupModalVisible(true)}>
            <Text style={styles.headerBtnText}>👥 Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postStatusBtn} onPress={() => setStatusModalVisible(true)}>
            <Text style={styles.postStatusText}>+ Status</Text>
          </TouchableOpacity>
        </View>
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

      {/* Main Chat Workspace */}
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
              <View>
                <Text style={styles.chatHeaderTitle}>{activeChat.name}</Text>
                <Text style={styles.chatHeaderSub}>
                  {activeChat.type === 'group' ? 'Group Chat' : 'Direct Message'}
                </Text>
              </View>
              {activeChat.type === 'group' && (
                <TouchableOpacity
                  style={styles.groupInfoBtn}
                  onPress={() => {
                    fetchGroupMembers(activeChat.chatId);
                    setGroupMembersModalVisible(true);
                  }}
                >
                  <Text style={styles.groupInfoText}>👥 Members</Text>
                </TouchableOpacity>
              )}
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

            {/* Input Bar */}
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

      {/* Start Direct Chat Modal */}
      <Modal visible={newChatModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💬 Start Direct Chat</Text>
            <Text style={styles.modalSubtitle}>Pick a contact to message directly.</Text>

            <FlatList
              data={users.filter(u => u.userId !== 'admin')}
              keyExtractor={item => item.userId}
              style={{ maxHeight: 250, marginVertical: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userPickRow}
                  onPress={() => handleStartDirectChat(item)}
                >
                  <Text style={styles.userPickAvatar}>{item.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userPickName}>{item.name}</Text>
                    <Text style={styles.userPickStatus}>{item.status}</Text>
                  </View>
                  <Text style={styles.startText}>Start 💬</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setNewChatModalVisible(false)}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Group Chat Modal */}
      <Modal visible={createGroupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>👥 Create WhatsApp Group</Text>
            <Text style={styles.modalSubtitle}>Enter group name & select members.</Text>

            <TextInput
              style={styles.modalSingleInput}
              placeholder="Group Subject / Title..."
              placeholderTextColor="#94a3b8"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={styles.memberPickerLabel}>Select Members:</Text>

            <FlatList
              data={users.filter(u => u.userId !== 'admin')}
              keyExtractor={item => item.userId}
              style={{ maxHeight: 180, marginBottom: 15 }}
              renderItem={({ item }) => {
                const isSelected = selectedMembers.includes(item.userId);
                return (
                  <TouchableOpacity
                    style={[styles.userPickRow, isSelected && styles.userPickRowSelected]}
                    onPress={() => toggleMemberSelection(item.userId)}
                  >
                    <Text style={styles.userPickAvatar}>{item.avatar}</Text>
                    <Text style={[styles.userPickName, { flex: 1 }]}>{item.name}</Text>
                    <Text style={{ color: isSelected ? '#10b981' : '#94a3b8', fontWeight: '700' }}>
                      {isSelected ? '✓ Added' : '+ Add'}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPost]} onPress={handleCreateGroup}>
                <Text style={styles.modalBtnText}>Create Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setCreateGroupModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Members & Add People Drawer Modal */}
      <Modal visible={groupMembersModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>👥 Group Members</Text>
            <Text style={styles.modalSubtitle}>{activeChat?.name}</Text>

            <Text style={styles.memberPickerLabel}>Current Members ({groupMembersList.length}):</Text>
            <ScrollView style={{ maxHeight: 120, marginBottom: 15 }}>
              {groupMembersList.map(m => (
                <View key={m.userId} style={styles.memberRow}>
                  <Text style={styles.memberAvatar}>{m.avatar}</Text>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberBadge}>{m.userId === 'admin' ? 'Admin' : 'Member'}</Text>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.memberPickerLabel}>Add New People:</Text>
            <ScrollView style={{ maxHeight: 120, marginBottom: 15 }}>
              {users
                .filter(u => !groupMembersList.some(m => m.userId === u.userId))
                .map(u => (
                  <TouchableOpacity key={u.userId} style={styles.userPickRow} onPress={() => handleAddMembersToGroup(u)}>
                    <Text style={styles.userPickAvatar}>{u.avatar}</Text>
                    <Text style={[styles.userPickName, { flex: 1 }]}>{u.name}</Text>
                    <Text style={{ color: '#6366f1', fontWeight: '700' }}>+ Add</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setGroupMembersModalVisible(false)}>
              <Text style={styles.modalBtnCancelText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Composer Modal */}
      <Modal visible={statusModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✨ Share a Status Post</Text>
            <Text style={styles.modalSubtitle}>Disappears automatically after 24 hours.</Text>

            <View style={[styles.previewCard, { backgroundColor: getSolidColor(selectedColor) }]}>
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

            <View style={styles.gradientRow}>
              {['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.colorCircleActive]}
                  onPress={() => setSelectedColor(color)}
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
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: { paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: { fontSize: 22, marginRight: 6 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  headerBtnGroup: { flexDirection: 'row', gap: 6 },
  newChatHeaderBtn: { backgroundColor: '#6366f1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  newGroupHeaderBtn: { backgroundColor: '#06b6d4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  postStatusBtn: { backgroundColor: '#ec4899', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  headerBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  postStatusText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  statusTrayContainer: { paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statusTray: { paddingHorizontal: 15, alignItems: 'center' },
  myStatusItem: { alignItems: 'center', marginRight: 15, width: 60 },
  myStatusAddCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  addPlus: { color: '#6366f1', fontSize: 22, fontWeight: '700' },
  statusItem: { alignItems: 'center', marginRight: 15, width: 60 },
  statusRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, padding: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1e', marginBottom: 4 },
  statusAvatar: { fontSize: 20 },
  statusLabel: { color: '#94a3b8', fontSize: 10, textAlign: 'center' },
  mainWorkspace: { flex: 1 },
  chatPickerContainer: { paddingVertical: 8, paddingHorizontal: 15 },
  chatPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chatPillActive: { backgroundColor: '#6366f1', borderColor: '#818cf8' },
  chatPillText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  chatPillTextActive: { color: '#ffffff' },
  chatWindow: { flex: 1, marginHorizontal: 12, marginBottom: 10, borderRadius: 16, backgroundColor: 'rgba(15,22,45,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  chatHeader: { padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatHeaderTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  chatHeaderSub: { color: '#10b981', fontSize: 11, fontWeight: '600' },
  groupInfoBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  groupInfoText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  messageList: { padding: 12 },
  msgRow: { marginBottom: 10, maxWidth: '80%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgSender: { color: '#94a3b8', fontSize: 10, marginBottom: 2 },
  msgBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  msgBubbleSent: { backgroundColor: '#6366f1' },
  msgBubbleReceived: { backgroundColor: 'rgba(255,255,255,0.1)' },
  msgText: { color: '#ffffff', fontSize: 13, lineHeight: 18 },
  inputBar: { flexDirection: 'row', padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center' },
  textInput: { flex: 1, height: 38, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 19, paddingHorizontal: 14, color: '#ffffff', marginRight: 6 },
  sendButton: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 19 },
  sendButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  emptyContainer: { flex: 1, alignItems: 'center', justify: 'center' },
  emptyText: { color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 15 },
  modalCard: { width: '100%', backgroundColor: '#0a0f1e', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#6366f1' },
  modalTitle: { color: '#ffffff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  modalSubtitle: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginBottom: 12 },
  modalSingleInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, color: '#ffffff', marginBottom: 12 },
  memberPickerLabel: { color: '#ffffff', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  userPickRow: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 6 },
  userPickRowSelected: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: '#10b981' },
  userPickAvatar: { fontSize: 20, marginRight: 10 },
  userPickName: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  userPickStatus: { color: '#94a3b8', fontSize: 10 },
  startText: { color: '#6366f1', fontWeight: '700', fontSize: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  memberAvatar: { fontSize: 18, marginRight: 8 },
  memberName: { color: '#ffffff', flex: 1, fontSize: 12, fontWeight: '600' },
  memberBadge: { color: '#10b981', fontSize: 10, fontWeight: '700' },
  previewCard: { height: 100, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12 },
  previewText: { color: '#ffffff', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, color: '#ffffff', height: 60, textAlignVertical: 'top', marginBottom: 12 },
  gradientRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  colorCircleActive: { borderWidth: 2, borderColor: '#ffffff' },
  modalActionRow: { flexDirection: 'row', gap: 8 },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modalBtnPost: { backgroundColor: '#ec4899' },
  modalBtnCancel: { backgroundColor: 'rgba(255,255,255,0.08)' },
  modalBtnText: { color: '#ffffff', fontWeight: '700' },
  modalBtnCancelText: { color: '#94a3b8', fontWeight: '700' },
  storyFullscreen: { flex: 1 },
  closeStoryBtn: { alignSelf: 'flex-end', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  closeStoryText: { color: '#ffffff', fontSize: 16 },
  storyHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  storyAvatar: { fontSize: 26, marginRight: 8 },
  storyUser: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  storyBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  storyContent: { color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  storyFooter: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 11, marginBottom: 15 }
});
