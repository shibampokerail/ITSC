document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selections ---
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const messagesContainer = document.getElementById('chat-messages');
    const loaderOverlay = document.getElementById('loader-overlay');

    // --- Configuration ---
    const n8nChatUrl = ''; // <-- IMPORTANT: REPLACE WITH YOUR CHAT URL
    const n8nRefreshUrl = ''; // <-- IMPORTANT: ADD YOUR REFRESH URL
    const username = '';
    const password = '';

    // =================================================================
    // CHAT MESSAGE HANDLING
    // =================================================================
    const handleSendMessage = async () => {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;
        autoResizeTextarea();

        appendMessage(messageText, 'user-message');
        appendThinkingAnimation();

        try {
            const botReply = await sendToN8nChat(messageText);
            removeThinkingAnimation();
            appendMessage(botReply, 'bot-message');
        } catch (error) {
            removeThinkingAnimation();
            appendMessage('Sorry, an error occurred. Please try again.', 'bot-message');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    };

    async function sendToN8nChat(message) {
        const credentials = btoa(`${username}:${password}`);
        try {
            const response = await fetch(n8nChatUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${credentials}` },
                body: JSON.stringify({ message: message, source: 'web-chatbot', timestamp: new Date().toISOString() })
            });
            if (!response.ok) {
                console.error('Failed to send message to n8n:', response.statusText);
                return 'Sorry, there was a problem connecting to the server.';
            }
            const responseData = await response.json();
            return responseData.output || 'I received your message but got no response.';
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    // =================================================================
    // KNOWLEDGEBASE REFRESH HANDLING
    // =================================================================
    const handleRefresh = async () => {
        loaderOverlay.style.display = 'flex'; // Show loader and "freeze" page
        
        try {
            const response = await fetch(n8nRefreshUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(`${username}:${password}`)}` },
                body: JSON.stringify({ action: 'refresh_knowledgebase', timestamp: new Date().toISOString() })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            // Optional: Check response from n8n if needed
            // const result = await response.json();
            // console.log('Refresh successful:', result);

            showNotification('Knowledgebase refresh completed successfully!', 'success');

        } catch (error) {
            console.error('Failed to refresh knowledgebase:', error);
            showNotification('Failed to refresh knowledgebase. Please check the console.', 'error');
        } finally {
            loaderOverlay.style.display = 'none'; // Always hide loader and "unfreeze" page
        }
    };

    // =================================================================
    // UI HELPER FUNCTIONS
    // =================================================================

    function appendMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', className);
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        if (className === 'bot-message') {
            contentDiv.innerHTML = marked.parse(text);
        } else {
            const p = document.createElement('p');
            p.textContent = text;
            contentDiv.appendChild(p);
        }
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        messagesContainer.appendChild(notification);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Automatically remove the notification after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    function appendThinkingAnimation() {
        // Implementation from previous step
        const thinkingDiv = document.createElement('div');
        thinkingDiv.classList.add('message', 'bot-message', 'thinking-animation');
        thinkingDiv.innerHTML = `<div class="message-content"><span class="dot dot1"></span><span class="dot dot2"></span><span class="dot dot3"></span></div>`;
        messagesContainer.appendChild(thinkingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeThinkingAnimation() {
        // Implementation from previous step
        const thinkingMessage = document.querySelector('.thinking-animation');
        if (thinkingMessage) thinkingMessage.remove();
    }
    
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    userInput.addEventListener('input', autoResizeTextarea);
    refreshBtn.addEventListener('click', handleRefresh);
});
