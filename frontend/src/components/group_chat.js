// Group Chat Creation Component
async function createNewGroupChat() {
    const title = prompt('Enter Group Name (e.g. Computer Science Class):');
    if (!title || !title.trim()) return;

    try {
        const res = await fetch('/api/conversations/group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                member_user_ids: state.peers.map(p => p.user_id)
            })
        }).then(r => r.json());

        if (res.success) {
            await fetchPeersAndConversations();
            const grp = state.conversations.find(c => c.id === res.conversation_id);
            if (grp) selectConversation(grp);
        }
    } catch (e) {
        console.error('Failed to create group:', e);
    }
}
