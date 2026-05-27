import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private apiUrl = 'http://localhost:8000/api/interactions';
  private wsUrl = 'ws://localhost:8000/ws/chat';
  private socket: WebSocket | null = null;

  constructor(private http: HttpClient, private authService: AuthService) { }

  // COMMENTS API
  getComments(eventId: number): Observable<any[]> {
    let params = new HttpParams().set('event', eventId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/comments/`, { params });
  }

  postComment(eventId: number, text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/comments/`, { event: eventId, text: text });
  }

  // CHAT API
  getMessages(roomName: string): Observable<any[]> {
    let params = new HttpParams().set('room', roomName);
    return this.http.get<any[]>(`${this.apiUrl}/messages/`, { params });
  }

  sendMessage(roomName: string, message: string, receiverId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages/`, {
      room_group_name: roomName,
      message: message,
      receiver: receiverId
    });
  }

  // WEBSOCKET
  connectToChat(roomName: string, onMessageCallback: (msg: any) => void) {
    if (this.socket) {
      this.socket.close();
    }
    
    this.socket = new WebSocket(`${this.wsUrl}/${roomName}/`);
    
    this.socket.onopen = () => {
      console.log(`Connected to chat room: ${roomName}`);
    };
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessageCallback(data);
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  disconnectChat() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
