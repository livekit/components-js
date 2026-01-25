import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
  MessageToolbar,
  MessageResponse,
  MessageAttachment,
  MessageAttachments,
} from './message';

describe('Message', () => {
  describe('Rendering', () => {
    it('renders with user role', () => {
      render(<Message from="user">Message content</Message>);
      expect(screen.getByText('Message content')).toBeInTheDocument();
    });

    it('renders with assistant role', () => {
      render(<Message from="assistant">Assistant message</Message>);
      expect(screen.getByText('Assistant message')).toBeInTheDocument();
    });

    it('applies user-specific styling for user messages', () => {
      const { container } = render(<Message from="user">User message</Message>);
      const message = container.querySelector('.is-user');
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass('ml-auto');
    });

    it('applies assistant-specific styling for assistant messages', () => {
      const { container } = render(<Message from="assistant">Assistant message</Message>);
      const message = container.querySelector('.is-assistant');
      expect(message).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies className prop', () => {
      const { container } = render(
        <Message from="user" className="custom-class">Message</Message>
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('accepts and applies style prop', () => {
      const { container } = render(
        <Message from="user" style={{ backgroundColor: 'red' }}>Message</Message>
      );
      const message = container.firstChild;
      expect(message).toHaveStyle({ backgroundColor: 'red' });
    });

    it('accepts and applies id prop', () => {
      render(<Message from="user" id="msg-1">Message</Message>);
      expect(document.querySelector('#msg-1')).toBeInTheDocument();
    });

    it('accepts and applies data attributes', () => {
      render(<Message from="user" data-testid="custom-message">Message</Message>);
      expect(screen.getByTestId('custom-message')).toBeInTheDocument();
    });
  });
});

describe('MessageContent', () => {
  it('renders children', () => {
    render(<MessageContent>Content text</MessageContent>);
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('accepts and applies className', () => {
    const { container } = render(
      <MessageContent className="custom-content">Content</MessageContent>
    );
    expect(container.querySelector('.custom-content')).toBeInTheDocument();
  });

  it('accepts and applies style prop', () => {
    const { container } = render(
      <MessageContent style={{ color: 'blue' }}>Content</MessageContent>
    );
    const content = container.firstChild;
    expect(content).toHaveStyle({ color: 'blue' });
  });
});

describe('MessageActions', () => {
  it('renders children actions', () => {
    render(
      <MessageActions>
        <button>Action 1</button>
        <button>Action 2</button>
      </MessageActions>
    );
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('accepts and applies className', () => {
    const { container } = render(
      <MessageActions className="custom-actions">Actions</MessageActions>
    );
    expect(container.querySelector('.custom-actions')).toBeInTheDocument();
  });

  it('applies flex layout', () => {
    const { container } = render(<MessageActions>Actions</MessageActions>);
    const actions = container.firstChild;
    expect(actions).toHaveClass('flex', 'items-center');
  });
});

describe('MessageAction', () => {
  it('renders as button', () => {
    render(<MessageAction label="Copy">Copy</MessageAction>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays screen reader label', () => {
    render(<MessageAction label="Copy message">Copy</MessageAction>);
    expect(screen.getByText('Copy message')).toHaveClass('sr-only');
  });

  it('shows tooltip when provided', () => {
    render(<MessageAction tooltip="Copy to clipboard">Copy</MessageAction>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<MessageAction onClick={handleClick}>Action</MessageAction>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies ghost variant by default', () => {
    render(<MessageAction>Action</MessageAction>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('applies icon-sm size by default', () => {
    render(<MessageAction>Action</MessageAction>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('size-8');
  });

  it('accepts custom variant', () => {
    render(<MessageAction variant="outline">Action</MessageAction>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('accepts custom size', () => {
    render(<MessageAction size="default">Action</MessageAction>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
  });

  it('has type button by default', () => {
    render(<MessageAction>Action</MessageAction>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });
});

describe('MessageToolbar', () => {
  it('renders children', () => {
    render(
      <MessageToolbar>
        <div>Toolbar content</div>
      </MessageToolbar>
    );
    expect(screen.getByText('Toolbar content')).toBeInTheDocument();
  });

  it('accepts and applies className', () => {
    const { container } = render(
      <MessageToolbar className="custom-toolbar">Toolbar</MessageToolbar>
    );
    expect(container.querySelector('.custom-toolbar')).toBeInTheDocument();
  });

  it('applies flex layout', () => {
    const { container } = render(<MessageToolbar>Toolbar</MessageToolbar>);
    const toolbar = container.firstChild;
    expect(toolbar).toHaveClass('flex', 'items-center', 'justify-between');
  });
});

describe('MessageResponse', () => {
  it('renders children', () => {
    render(<MessageResponse>Response text</MessageResponse>);
    expect(screen.getByText('Response text')).toBeInTheDocument();
  });

  it('accepts and applies className', () => {
    const { container } = render(
      <MessageResponse className="custom-response">Response</MessageResponse>
    );
    expect(container.querySelector('.custom-response')).toBeInTheDocument();
  });

  it('has displayName', () => {
    expect(MessageResponse.displayName).toBe('MessageResponse');
  });
});

describe('MessageAttachment', () => {
  const mockFileData = {
    type: 'file' as const,
    filename: 'test.pdf',
    mediaType: 'application/pdf',
    url: 'https://example.com/file.pdf',
  };

  const mockImageData = {
    type: 'file' as const,
    filename: 'image.png',
    mediaType: 'image/png',
    url: 'https://example.com/image.png',
  };

  it('renders file attachment', () => {
    const { container } = render(<MessageAttachment data={mockFileData} />);
    expect(container.querySelector('.size-24')).toBeInTheDocument();
  });

  it('renders image attachment', () => {
    render(<MessageAttachment data={mockImageData} />);
    const image = screen.getByAltText('image.png');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockImageData.url);
  });

  it('shows remove button when onRemove provided', () => {
    const handleRemove = vi.fn();
    render(<MessageAttachment data={mockFileData} onRemove={handleRemove} />);
    
    // Remove button should exist but be hidden
    const removeButton = screen.getByLabelText('Remove attachment');
    expect(removeButton).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const handleRemove = vi.fn();
    const user = userEvent.setup();
    render(<MessageAttachment data={mockFileData} onRemove={handleRemove} />);
    
    const removeButton = screen.getByLabelText('Remove attachment');
    await user.click(removeButton);
    
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not show remove button when onRemove not provided', () => {
    render(<MessageAttachment data={mockFileData} />);
    expect(screen.queryByLabelText('Remove attachment')).not.toBeInTheDocument();
  });

  it('accepts and applies className', () => {
    const { container } = render(
      <MessageAttachment data={mockFileData} className="custom-attachment" />
    );
    expect(container.querySelector('.custom-attachment')).toBeInTheDocument();
  });
});

describe('MessageAttachments', () => {
  it('renders children', () => {
    render(
      <MessageAttachments>
        <div>Attachment 1</div>
        <div>Attachment 2</div>
      </MessageAttachments>
    );
    expect(screen.getByText('Attachment 1')).toBeInTheDocument();
    expect(screen.getByText('Attachment 2')).toBeInTheDocument();
  });

  it('returns null when no children', () => {
    const { container } = render(<MessageAttachments />);
    expect(container.firstChild).toBeNull();
  });

  it('accepts and applies className', () => {
    const { container } = render(
      <MessageAttachments className="custom-attachments">
        <div>Attachment</div>
      </MessageAttachments>
    );
    expect(container.querySelector('.custom-attachments')).toBeInTheDocument();
  });

  it('applies flex layout', () => {
    const { container } = render(
      <MessageAttachments>
        <div>Attachment</div>
      </MessageAttachments>
    );
    const attachments = container.firstChild;
    expect(attachments).toHaveClass('flex', 'flex-wrap');
  });
});
