import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AIChatService } from 'src/app/core/services/ai-chat.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { MarkdownPipe } from 'src/app/shared/pipes/markdown.pipe';

/**
 * AIChatComponent
 * - Small chat widget fixed at bottom-right.
 * - User messages include "You"; assistant messages labeled "Assistant".
 * - Uses AIChatService to send/receive messages.
 * - Keeps conversation locally; backend could persist conversationId.
 */
@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MarkdownPipe],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css'],
})
export class AIChatComponent implements OnInit {
  @ViewChild('messagesList') messagesList!: ElementRef<HTMLElement>;

  // Chat state
  open = signal<boolean>(false);
  messages = signal<Array<{ from: 'user' | 'assistant'; name?: string; text: string }>>([]);
  input = signal<string>('');
  loading = signal<boolean>(false);

  private conversationId: string | null = null;
  readonly i18n = inject(I18nService);

  constructor(private ai: AIChatService) {}

  ngOnInit(): void {
    this.setInitialMessage('chat.welcome');
  }

  /** Start a new conversation */
  newChat() {
    if (this.conversationId) {
      this.ai.clearSession(this.conversationId).subscribe({
        next: () => console.log('Session cleared on backend'),
        error: (err) => console.error('Error clearing session', err),
      });
    }

    this.conversationId = null;
    this.setInitialMessage('chat.newStarted');
  }

  /** Open the chat panel */
  openChat() {
    this.open.set(true);
    this.scrollToBottom();
  }

  /** Close the chat panel */
  closeChat() {
    this.open.set(false);
  }

  /** Send user message and handle assistant response */
  send() {
    const text = this.input().trim();
    if (!text) return;

    this.addMessage('user', text, 'You');
    this.input.set('');
    this.loading.set(true);

    this.ai.sendMessage(this.conversationId, text).subscribe({
      next: (res) => {
        console.log('AI response', res);
        // Update conversation ID if it was null (first message)
        if (!this.conversationId) this.conversationId = res.conversationId;
        
        this.addMessage('assistant', res.answer ?? 'Sorry, I could not generate a response.', 'Assistant');
        this.loading.set(false);
      },
      error: (err) => {
        // Global error interceptor will handle the toast, we just stop loading
        this.handleError(err);
      },
    });
  }

  /** Helper: add a message and scroll to bottom */
  private addMessage(from: 'user' | 'assistant', text: string, name?: string) {
    this.messages.update((m) => [...m, { from, name, text }]);
    this.scrollToBottom();
  }

  /** Helper: set initial assistant message */
  private setInitialMessage(textKey: string) {
    this.messages.set([
      {
        from: 'assistant',
        name: this.i18n.translate('chat.assistant'),
        text: this.i18n.translate(textKey),
      },
    ]);
    this.scrollToBottom();
  }

  /** Helper: handle errors from AI service */
  private handleError(err: any) {
    console.error('AI chat error', err);
    this.addMessage('assistant', 'An error occurred. Please try again later.', 'Assistant');
    this.loading.set(false);
  }

  /** Scroll messages container to bottom */
  private scrollToBottom() {
    requestAnimationFrame(() => {
      try {
        const el = this.messagesList?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      } catch (e) {
        console.log('Scroll to bottom failed', e);
      }
    });
  }
}
