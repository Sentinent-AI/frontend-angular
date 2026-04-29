import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SignalService } from '../../services/signal.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-nav.html',
  styleUrl: './app-nav.css',
})
export class AppNavComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly signalService = inject(SignalService);
  private readonly router = inject(Router);

  unreadCount = 0;
  private pollInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.refreshUnread();
    // Poll every 60s so the badge stays fresh without hammering the API
    this.pollInterval = setInterval(() => this.refreshUnread(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval !== undefined) {
      clearInterval(this.pollInterval);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get badgeLabel(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  private refreshUnread(): void {
    this.signalService.getSignals({ source: 'all', status: 'unread' }).subscribe({
      next: (signals) => { this.unreadCount = signals.length; },
      error: () => {}
    });
  }
}
