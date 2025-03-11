function initEdnaChat(apiUrl) {
    // DOM Elements
    const chatButton = document.getElementById('edna-chat-button');
    const chatInterface = document.getElementById('edna-chat-interface');
    const chatClose = document.querySelector('.edna-chat-close');
    const chatMessages = document.getElementById('edna-chat-messages');
    const chatInput = document.getElementById('edna-chat-input');
    const chatSend = document.getElementById('edna-chat-send');
    
    console.log('API URL from metafields:', '{{ app.metafields.edna.api_url }}');

    // State
    let isOpen = false;
    let isWaitingForResponse = false;
    
    // Toggle chat interface
    function toggleChat() {
      isOpen = !isOpen;
      chatInterface.style.display = isOpen ? 'flex' : 'none';
      
      if (isOpen) {
        chatInput.focus();
        // Scroll to the bottom of messages
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
    
    // Add a new message to the chat
    function addMessage(content, isUser = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = isUser ? 'edna-message edna-user-message' : 'edna-message edna-ai-message';
      
      const messageContent = document.createElement('div');
      messageContent.className = 'edna-message-content';
      messageContent.textContent = content;
      
      messageDiv.appendChild(messageContent);
      chatMessages.appendChild(messageDiv);
      
      // Scroll to the latest message
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'edna-message edna-ai-message edna-typing';
      indicator.id = 'edna-typing-indicator';
      
      const indicatorContent = document.createElement('div');
      indicatorContent.className = 'edna-message-content';
      indicatorContent.innerHTML = '<span class="edna-dot"></span><span class="edna-dot"></span><span class="edna-dot"></span>';
      
      indicator.appendChild(indicatorContent);
      chatMessages.appendChild(indicator);
      
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
      const indicator = document.getElementById('edna-typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
    
    // Send message to API
    async function sendMessageToApi(message) {
      try {
        isWaitingForResponse = true;
        showTypingIndicator();
        
        const response = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        removeTypingIndicator();
        
        if (data && data.response) {
          addMessage(data.response);
        } else {
          addMessage("I'm sorry, I couldn't process your request. Please try again.");
        }
      } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        addMessage("I'm sorry, there was an error connecting to my brain. Please try again later.");
      } finally {
        isWaitingForResponse = false;
      }
    }
    
    // Handle sending a message
    function handleSendMessage() {
      const message = chatInput.value.trim();
      
      if (message && !isWaitingForResponse) {
        addMessage(message, true);
        chatInput.value = '';
        sendMessageToApi(message);
      }
    }
    
    // Event Listeners
    chatButton.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);
    
    chatSend.addEventListener('click', handleSendMessage);
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
    
    // Handle clicks outside the chat to close it
    document.addEventListener('click', (e) => {
      if (isOpen && 
          !chatInterface.contains(e.target) && 
          !chatButton.contains(e.target)) {
        toggleChat();
      }
    });
    
    // Auto-resize textarea as user types
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = (chatInput.scrollHeight < 120) ? 
        chatInput.scrollHeight + 'px' : '120px';
    });
  }