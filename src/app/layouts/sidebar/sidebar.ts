import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, DecimalPipe],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-header">
        <a routerLink="/" class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text" [class.hidden]="collapsed()">SIFRA</span>
        </a>
        <button class="collapse-btn" (click)="toggleCollapse()">
          <span class="collapse-icon">{{ collapsed() ? '→' : '←' }}</span>
        </button>
      </div>

      <nav class="nav">
        @for (link of navLinks(); track link.path) {
        <a [routerLink]="link.path" routerLinkActive="active" class="nav-link" [title]="link.label">
          <span class="nav-icon">{{ link.icon }}</span>
          <span class="nav-label" [class.hidden]="collapsed()">{{ link.label }}</span>
        </a>
        }
      </nav>

      <div class="sidebar-footer" [class.hidden]="collapsed()">
        @if (walletService.isOnboarded()) {
        <div class="balance-mini">
          <span class="balance-label">Balance</span>
          <span class="balance-value">{{ walletService.balance() | number : '1.2-2' }} SFR</span>
        </div>
        }
      </div>
    </aside>

    <!-- Mobile overlay -->
    @if (mobileOpen()) {
    <div class="mobile-overlay" (click)="closeMobile()"></div>
    }

    <!-- Mobile bottom nav -->
    <nav class="mobile-nav">
      @for (link of mobileLinks; track link.path) {
      <a [routerLink]="link.path" routerLinkActive="active" class="mobile-nav-link">
        <span class="nav-icon">{{ link.icon }}</span>
        <span class="nav-label">{{ link.label }}</span>
      </a>
      }
    </nav>
  `,
  styles: [
    `
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 240px;
        background-color: var(--color-surface);
        border-right: 1px solid var(--color-surface-border);
        display: flex;
        flex-direction: column;
        transition: width var(--transition-normal);
        z-index: 100;
      }

      .sidebar.collapsed {
        width: 72px;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--color-surface-border);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        text-decoration: none;
        color: var(--color-text);
        font-weight: 700;
        font-size: var(--font-size-lg);
      }

      .logo-icon {
        color: var(--color-accent);
        font-size: var(--font-size-2xl);
      }

      .collapse-btn {
        background: none;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        padding: var(--spacing-xs);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }

      .collapse-btn:hover {
        background-color: var(--color-surface-light);
        color: var(--color-text);
      }

      .nav {
        flex: 1;
        padding: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        color: var(--color-text-secondary);
        text-decoration: none;
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
        font-weight: 500;
      }

      .nav-link:hover {
        background-color: var(--color-surface-light);
        color: var(--color-text);
      }

      .nav-link.active {
        background-color: var(--color-accent-light);
        color: var(--color-accent);
      }

      .nav-icon {
        font-size: var(--font-size-xl);
        width: 24px;
        text-align: center;
      }

      .sidebar-footer {
        padding: var(--spacing-lg);
        border-top: 1px solid var(--color-surface-border);
      }

      .balance-mini {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .balance-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .balance-value {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-accent);
      }

      .hidden {
        display: none;
      }

      /* Mobile overlay */
      .mobile-overlay {
        display: none;
      }

      /* Mobile bottom nav */
      .mobile-nav {
        display: none;
      }

      @media (max-width: 768px) {
        .sidebar {
          display: none;
        }

        .mobile-nav {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-surface);
          border-top: 1px solid var(--color-surface-border);
          padding: var(--spacing-sm) var(--spacing-md);
          justify-content: space-around;
          z-index: 100;
        }

        .mobile-nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          font-size: var(--font-size-xs);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .mobile-nav-link:hover,
        .mobile-nav-link.active {
          color: var(--color-accent);
        }

        .mobile-nav-link .nav-icon {
          font-size: var(--font-size-xl);
        }
      }
    `,
  ],
})
export class SidebarComponent {
  protected readonly walletService = inject(WalletService);
  protected readonly authService = inject(AuthService);
  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);

  // Dynamic nav links based on authentication status
  protected readonly navLinks = computed(() => {
    const isAuth = this.authService.isAuthenticated();
    if (isAuth) {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
        { path: '/send', label: 'Send', icon: '↗' },
        { path: '/receive', label: 'Receive', icon: '↙' },
        { path: '/history', label: 'History', icon: '☰' },
        { path: '/profile', label: 'Profile', icon: '⚙' },
      ];
    }
    return [
      { path: '/login', label: 'Login', icon: '→' },
      { path: '/onboarding', label: 'Create Wallet', icon: '⊕' },
      { path: '/recover', label: 'Recover Key', icon: '🔑' },
    ];
  });

  protected readonly mobileLinks = [
    { path: '/dashboard', label: 'Home', icon: '⌂' },
    { path: '/send', label: 'Send', icon: '↗' },
    { path: '/receive', label: 'Receive', icon: '↙' },
    { path: '/history', label: 'History', icon: '☰' },
    { path: '/profile', label: 'Profile', icon: '⚙' },
  ];

  toggleCollapse(): void {
    this.collapsed.update((c) => !c);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
