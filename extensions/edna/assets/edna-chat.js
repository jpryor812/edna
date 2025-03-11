function initEdnaChat(apiUrl) {
  // DOM Elements
  const chatButton = document.getElementById('edna-chat-button');
  const chatInterface = document.getElementById('edna-chat-interface');
  const chatClose = document.querySelector('.edna-chat-close');
  const chatMessages = document.getElementById('edna-chat-messages');
  const chatInput = document.getElementById('edna-chat-input');
  const chatSend = document.getElementById('edna-chat-send');
  
  // Maintain conversation context on the client side.
  // This array will accumulate the conversation during the session.
  let conversationContext = [];
  
  // State flags
  let isOpen = false;
  let isWaitingForResponse = false;
  
  // Toggle chat interface visibility
  function toggleChat() {
    isOpen = !isOpen;
    chatInterface.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      chatInput.focus();
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Append a new message to the chat window
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'edna-message edna-user-message' : 'edna-message edna-ai-message';
    const messageContent = document.createElement('div');
    messageContent.className = 'edna-message-content';
    messageContent.textContent = content;
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Display a typing indicator
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
  
  // Remove the typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById('edna-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  // Send message and conversation context to the API
  async function sendMessageToApi(message) {
    try {
      isWaitingForResponse = true;
      showTypingIndicator();
      
      // Append the user's new message to the conversation context.
      conversationContext.push({ role: 'user', content: message });
      
      // Construct the payload with the current conversation history.
      const payload = {
        message: message,
        conversation: conversationContext
      };
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      removeTypingIndicator();
      
      if (data && data.response) {
        addMessage(data.response);
        // Append AI's response to the conversation context.
        conversationContext.push({ role: 'assistant', content: data.response });
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
  
  // Handle sending a message from the input
  function handleSendMessage() {
    const message = chatInput.value.trim();
    if (message && !isWaitingForResponse) {
      addMessage(message, true);
      chatInput.value = '';
      sendMessageToApi(message);
    }
  }
  
  // Set up event listeners
  chatButton.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', toggleChat);
  chatSend.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  document.addEventListener('click', (e) => {
    if (isOpen && !chatInterface.contains(e.target) && !chatButton.contains(e.target)) {
      toggleChat();
    }
  });
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight < 120)
      ? chatInput.scrollHeight + 'px'
      : '120px';
  });
}
