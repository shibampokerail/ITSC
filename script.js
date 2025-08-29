document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. AUTHENTICATION GATE
    // =================================================================
    const storedCredentials = sessionStorage.getItem('n8nCredentials');

    // If no credentials are found in sessionStorage, redirect to the login page.
    // This effectively protects the chat page from direct access.
    if (!storedCredentials) {
        window.location.href = 'login.html';
        return; // Stop executing the rest of the script immediately.
    }

    // =================================================================
    // 2. ELEMENT SELECTIONS & CONFIGURATION
    // =================================================================
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const messagesContainer = document.getElementById('chat-messages');
    const loaderOverlay = document.getElementById('loader-overlay');

    // --- Configuration ---
    // These placeholders will be replaced by your GitHub Actions deploy.yml workflow.
    const n8nChatUrl = 'https://n8n.shibampokhrel.com/webhook/5a073891-2aac-45a1-b7c0-5e33b6efaf67/chat';
    const n8nRefreshUrl = 'https://n8n.shibampokhrel.com/webhook/21c8582e-6325-4fee-8e8d-43f658858d19';

    // =================================================================
    // 3. CORE FUNCTIONS (CHAT AND REFRESH)
    // =================================================================

    /**
     * Handles the "Refresh Knowledgebase" button click.
     * Shows a full-page loader and calls the refresh webhook.
     */
    const handleRefresh = async () => {
        loaderOverlay.style.display = 'flex'; // Show loader and "freeze" page
        
        try {
            const response = await fetch(n8nRefreshUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${storedCredentials}` // Use stored credentials
                },
                body: JSON.stringify({ action: 'refresh_knowledgebase', timestamp: new Date().toISOString() })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            showNotification('Knowledgebase refresh has been initiated. This may take a few minutes.', 'success');

        } catch (error) {
            console.error('Failed to initiate knowledgebase refresh:', error);
            showNotification('Failed to start the refresh process. Please check the console.', 'error');
        } finally {
            loaderOverlay.style.display = 'none'; // Always hide loader and "unfreeze" page
        }
    };

    /**
     * Handles sending a user's message to the chat webhook.
     */
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
            const response = await fetch(n8nChatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${storedCredentials}` // Use stored credentials
                },
                body: JSON.stringify({
                    message: messageText,
                    source: 'web-chatbot',
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const responseData = await response.json();
            removeThinkingAnimation();
            appendMessage(responseData.output || 'Sorry, I received an empty response.', 'bot-message');

        } catch (error) {
            console.error('Error sending message:', error);
            removeThinkingAnimation();
            appendMessage('Sorry, an error occurred while trying to get a response. Please try again.', 'bot-message');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    };

    // =================================================================
    // 4. UI HELPER FUNCTIONS
    // =================================================================

    function appendMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', className);
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        if (className === 'bot-message') {
            contentDiv.innerHTML = marked.parse(text); // Render markdown for bot
        } else {
            const p = document.createElement('p');
            p.textContent = text; // Use textContent for user messages to prevent XSS
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
        setTimeout(() => { notification.remove(); }, 5000);
    }

    function appendThinkingAnimation() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.classList.add('message', 'bot-message', 'thinking-animation');
        thinkingDiv.innerHTML = `<div class="message-content"><span class="dot dot1"></span><span class="dot dot2"></span><span class="dot dot3"></span></div>`;
        messagesContainer.appendChild(thinkingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeThinkingAnimation() {
        const thinkingMessage = document.querySelector('.thinking-animation');
        if (thinkingMessage) thinkingMessage.remove();
    }
    
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    }

    // =================================================================
    // 5. EVENT LISTENERS
    // =================================================================
    sendBtn.addEventListener('click', handleSendMessage);
    refreshBtn.addEventListener('click', handleRefresh);
    userInput.addEventListener('input', autoResizeTextarea);

    userInput.addEventListener('keydown', (e) => {
        // Send message on Enter key, but allow new lines with Shift+Enter
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
});
