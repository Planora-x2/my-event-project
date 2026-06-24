import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanningService, PlanningChecklist, TimelineMilestone, EnquiryStatus } from '../../services/planning/planning.service';
import { EventService } from '../../services/event/event';

@Component({
  selector: 'app-planning-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning-dashboard.html',
  styleUrls: ['./planning-dashboard.css']
})
export class PlanningDashboardComponent implements OnInit {
  checklists: PlanningChecklist[] = [];
  milestones: TimelineMilestone[] = [];
  inquiries: EnquiryStatus[] = [];

  newChecklistTitle = '';
  newMilestoneTitle = '';
  newMilestoneDate = '';

  constructor(
    private planningService: PlanningService, 
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.planningService.getChecklists().subscribe(res => {
      this.checklists = res;
      this.cdr.detectChanges();
    });
    this.planningService.getMilestones().subscribe(res => {
      this.milestones = res;
      this.cdr.detectChanges();
    });
    this.planningService.getInquiries().subscribe(res => {
      this.inquiries = res;
      this.cdr.detectChanges();
    });
  }

  createChecklist() {
    if (!this.newChecklistTitle.trim()) return;
    this.planningService.createChecklist({ title: this.newChecklistTitle }).subscribe(() => {
      this.newChecklistTitle = '';
      this.loadData();
    });
  }

  addChecklistItem(checklist: PlanningChecklist, title: string) {
    if (!title.trim() || !checklist.id) return;
    this.planningService.addChecklistItem(checklist.id, { title, is_completed: false }).subscribe(() => {
      this.loadData();
    });
  }

  toggleChecklistItem(item: any) {
    this.planningService.updateChecklistItem(item.id, { is_completed: !item.is_completed }).subscribe(() => {
      this.loadData();
    });
  }

  createMilestone() {
    if (!this.newMilestoneTitle.trim()) return;
    this.planningService.createMilestone({
      title: this.newMilestoneTitle,
      due_date: this.newMilestoneDate || null,
      is_completed: false
    }).subscribe(() => {
      this.newMilestoneTitle = '';
      this.newMilestoneDate = '';
      this.loadData();
    });
  }

  toggleMilestone(m: TimelineMilestone) {
    if (!m.id) return;
    this.planningService.updateMilestone(m.id, { is_completed: !m.is_completed }).subscribe(() => {
      this.loadData();
    });
  }

  getEnquiryStatusLabel(status: string): string {
    const map: any = {
      'PENDING': 'Inquiry Sent',
      'RESPONDED': 'Vendor Responded',
      'ACCEPTED': 'Will get back to you soon',
      'SCHEDULED': 'Meeting Scheduled',
      'QUOTE': 'Quote Received',
      'CONFIRMED': 'Booking Confirmed',
      'COMPLETED': 'Completed'
    };
    return map[status] || status;
  }

  canReenquire(eq: EnquiryStatus): boolean {
    if (eq.status !== 'PENDING') return false;
    const createdTime = new Date(eq.created_at).getTime();
    const currentTime = new Date().getTime();
    const diffMinutes = (currentTime - createdTime) / (1000 * 60);
    return diffMinutes >= 30;
  }

  reenquire(eq: EnquiryStatus) {
    if (!eq.id) return;
    this.eventService.reenquire(eq.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => console.error('Failed to reenquire', err)
    });
  }
}
