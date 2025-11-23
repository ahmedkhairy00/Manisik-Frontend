import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface AIChatResponse {
  answer: string;
  // Optional fields if the backend returns them in future or other endpoints
  sessionId?: string;
  message?: string; 
  suggestedActions?: string[];
  data?: {
    intent: string;
    hotels: any | null;
    transports: any | null;
    userBookings: any | null;
  };
}


/**
 * AIChatService
 * Responsible for communicating with the backend AI endpoint.
 * - sendMessage(conversationId, message) sends the user's message and returns AI response.
 * - The backend contract is assumed to accept { conversationId?, message } and return { conversationId, reply }
 * - Keep this service small so it can be mocked in tests.
 */
@Injectable({ providedIn: 'root' })
export class AIChatService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /**
   * Sends a message to the AI Chatbot.
   * Payload: { sessionId, message }
   * Response: { answer: string }
   */
  sendMessage(sessionId: string | null, message: string): Observable<{ conversationId: string; answer: string }> {
    // Generate a new session ID if one doesn't exist
    if (!sessionId) sessionId = crypto.randomUUID();

    return this.http
      .post<AIChatResponse>(`${this.base}/ChatBotAi/chat`, {
        sessionId,
        message,
      })
      .pipe(
        map((res) => ({
          conversationId: sessionId!, // Return the same session ID as backend might not return it in the body based on the curl example
          answer: res.answer,         // Map 'answer' from response
        }))
      );
  }


  clearSession(sessionId: string) {
    return this.http.post(
      `${this.base}/ChatBotAi/clear?sessionId=${sessionId}`,
      {}
    );
  }
}
