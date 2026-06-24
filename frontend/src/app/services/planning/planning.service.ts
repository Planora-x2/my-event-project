import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../constants';

export interface PlanningChecklist {
  id?: number;
  title: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id?: number;
  title: string;
  is_completed: boolean;
  checklist?: number;
}

export interface TimelineMilestone {
  id?: number;
  title: string;
  due_date: string | null;
  is_completed: boolean;
}

export interface Collection {
  id?: number;
  title: string;
  items?: any[];
}

export interface EnquiryStatus {
  id: number;
  event: number;
  event_details?: any;
  status: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  private apiUrl = `${API_BASE}/api/planning`;

  constructor(private http: HttpClient) {}

  // Checklists
  getChecklists(): Observable<PlanningChecklist[]> {
    return this.http.get<PlanningChecklist[]>(`${this.apiUrl}/checklists/`);
  }
  createChecklist(data: any): Observable<PlanningChecklist> {
    return this.http.post<PlanningChecklist>(`${this.apiUrl}/checklists/`, data);
  }
  addChecklistItem(checklistId: number, data: any): Observable<ChecklistItem> {
    return this.http.post<ChecklistItem>(`${this.apiUrl}/checklists/${checklistId}/add_item/`, data);
  }
  updateChecklistItem(id: number, data: any): Observable<ChecklistItem> {
    return this.http.patch<ChecklistItem>(`${this.apiUrl}/checklist-items/${id}/`, data);
  }

  // Timeline
  getMilestones(): Observable<TimelineMilestone[]> {
    return this.http.get<TimelineMilestone[]>(`${this.apiUrl}/timeline-milestones/`);
  }
  createMilestone(data: any): Observable<TimelineMilestone> {
    return this.http.post<TimelineMilestone>(`${this.apiUrl}/timeline-milestones/`, data);
  }
  updateMilestone(id: number, data: any): Observable<TimelineMilestone> {
    return this.http.patch<TimelineMilestone>(`${this.apiUrl}/timeline-milestones/${id}/`, data);
  }

  // Collections
  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${this.apiUrl}/collections/`);
  }
  createCollection(data: any): Observable<Collection> {
    return this.http.post<Collection>(`${this.apiUrl}/collections/`, data);
  }
  addToCollection(collectionId: number, eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/collections/${collectionId}/add_item/`, { event: eventId });
  }

  // Inquiries
  getInquiries(): Observable<EnquiryStatus[]> {
    return this.http.get<EnquiryStatus[]>(`${API_BASE}/api/events/enquiries/`);
  }
}
