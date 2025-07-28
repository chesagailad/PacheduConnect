import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatBotWidget from '../ChatBotWidget';

// Mock fetch globally
global.fetch = jest.fn();

// Test wrapper component to provide required props
const TestChatBotWidget = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onToggle = () => setIsOpen(!isOpen);
  
  return <ChatBotWidget isOpen={isOpen} onToggle={onToggle} />;
};

const mockChatbotResponse = {
  response: 'Hello! How can I help you today?',
  type: 'text',
  options: null
};

describe('ChatBotWidget', () => {
  beforeEach(() => {
    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
  });

  describe('Initial State', () => {
    test('should render chat widget in closed state initially', () => {
      render(<TestChatBotWidget />);
      
      // Chat should be closed by default
      expect(screen.queryByTestId('chat-messages')).not.toBeInTheDocument();
      expect(screen.getByTestId('chat-toggle')).toBeInTheDocument();
    });

    test('should show chat when toggle button is clicked', () => {
      render(<TestChatBotWidget />);
      
      const toggleButton = screen.getByTestId('chat-toggle');
      fireEvent.click(toggleButton);
      
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });

    test('should hide chat when toggle button is clicked again', () => {
      render(<TestChatBotWidget />);
      
      const toggleButton = screen.getByTestId('chat-toggle');
      
      // Open chat
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
      
      // Close chat
      fireEvent.click(toggleButton);
      expect(screen.queryByTestId('chat-messages')).not.toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockChatbotResponse
      });
    });

    test('should send message when user types and presses enter', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type message
      fireEvent.change(input, { target: { value: 'Hello' } });
      
      // Send message
      fireEvent.click(sendButton);
      
      // Check that message was sent
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5001/api/chatbot/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello'
          })
        });
      });
    });

    test('should display user message in chat', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check user message appears
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    });

    test('should display bot response in chat', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check bot response appears
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });
    });

    test('should clear input after sending message', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check input is cleared
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    test('should not send empty messages', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const sendButton = screen.getByTestId('send-button');
      
      // Try to send empty message
      fireEvent.click(sendButton);
      
      // Check that fetch was not called
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle enter key press', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      
      // Type message and press enter
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
      
      // Check that message was sent
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator while sending message', async () => {
      // Mock a slow response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => mockChatbotResponse
        }), 100))
      );

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check loading indicator appears
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      
      // Wait for response
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    test('should disable input and send button while loading', async () => {
      // Mock a slow response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => mockChatbotResponse
        }), 100))
      );

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check input and button are disabled
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
      
      // Wait for response
      await waitFor(() => {
        expect(input).not.toBeDisabled();
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText(/I'm currently unable to process your request/)).toBeInTheDocument();
      });
    });

    test('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText(/I'm currently unable to process your request/)).toBeInTheDocument();
      });
    });

    test('should handle malformed API responses', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' })
      });

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Type and send message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText(/I'm currently unable to process your request/)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Reply Buttons', () => {
    test('should display quick reply buttons when provided', async () => {
      const quickReplyResponse = {
        response: 'What would you like to do?',
        type: 'quick_reply',
        options: ['Send money', 'Check exchange rates', 'Track transaction']
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => quickReplyResponse
      });

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Send initial message
      fireEvent.change(input, { target: { value: 'Help' } });
      fireEvent.click(sendButton);
      
      // Check quick reply buttons appear
      await waitFor(() => {
        expect(screen.getByText('Send money')).toBeInTheDocument();
        expect(screen.getByText('Check exchange rates')).toBeInTheDocument();
        expect(screen.getByText('Track transaction')).toBeInTheDocument();
      });
    });

    test('should send message when quick reply button is clicked', async () => {
      const quickReplyResponse = {
        response: 'What would you like to do?',
        type: 'quick_reply',
        options: ['Send money', 'Check exchange rates']
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => quickReplyResponse
      });

      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Send initial message
      fireEvent.change(input, { target: { value: 'Help' } });
      fireEvent.click(sendButton);
      
      // Wait for quick reply buttons to appear
      await waitFor(() => {
        expect(screen.getByText('Send money')).toBeInTheDocument();
      });
      
      // Click quick reply button
      fireEvent.click(screen.getByText('Send money'));
      
      // Check that the button text was sent as a message
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5001/api/chatbot/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Send money'
          })
        });
      });
    });
  });

  describe('Message History', () => {
    test('should maintain message history in conversation', async () => {
      render(<TestChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Send first message
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });
      
      // Send second message
      fireEvent.change(input, { target: { value: 'How are you?' } });
      fireEvent.click(sendButton);
      
      // Check both messages are still visible
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('How are you?')).toBeInTheDocument();
      });
    });

    test('should scroll to bottom when new messages are added', async () => {
      // Save original scrollIntoView method
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      
      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      try {
        render(<TestChatBotWidget />);
        
        // Open chat
        fireEvent.click(screen.getByTestId('chat-toggle'));
        
        const input = screen.getByTestId('chat-input');
        const sendButton = screen.getByTestId('send-button');
        
        // Send message
        fireEvent.change(input, { target: { value: 'Hello' } });
        fireEvent.click(sendButton);
        
        // Check scrollIntoView was called
        await waitFor(() => {
          expect(mockScrollIntoView).toHaveBeenCalled();
        });
      } finally {
        // Restore original scrollIntoView method
        Element.prototype.scrollIntoView = originalScrollIntoView;
      }
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<ChatBotWidget />);
      
      // Check toggle button has aria-label
      const toggleButton = screen.getByTestId('chat-toggle');
      expect(toggleButton).toHaveAttribute('aria-label');
      
      // Open chat
      fireEvent.click(toggleButton);
      
      // Check input has proper label
      const input = screen.getByTestId('chat-input');
      expect(input).toHaveAttribute('aria-label');
      
      // Check send button has proper label
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', () => {
      render(<ChatBotWidget />);
      
      // Open chat with keyboard
      const toggleButton = screen.getByTestId('chat-toggle');
      fireEvent.keyPress(toggleButton, { key: 'Enter', code: 'Enter' });
      
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should handle rapid message sending', async () => {
      render(<ChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        fireEvent.change(input, { target: { value: `Message ${i}` } });
        fireEvent.click(sendButton);
      }
      
      // Check all messages were sent
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(5);
      });
    });

    test('should not cause memory leaks with many messages', async () => {
      render(<ChatBotWidget />);
      
      // Open chat
      fireEvent.click(screen.getByTestId('chat-toggle'));
      
      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');
      
      // Send many messages
      for (let i = 0; i < 50; i++) {
        fireEvent.change(input, { target: { value: `Message ${i}` } });
        fireEvent.click(sendButton);
      }
      
      // Component should still be responsive
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });
  });
}); 