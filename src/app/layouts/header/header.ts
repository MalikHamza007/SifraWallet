import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-container">
        <a routerLink="/" class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text">SIFRA Wallet</span>
        </a>

        <button
          class="mobile-menu-btn"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Toggle navigation menu"
        >
          <span class="hamburger" [class.active]="menuOpen()">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <nav class="nav" [class.open]="menuOpen()">
          @for (link of navLinks; track link.path) {
          <a
            [routerLink]="link.path"
            routerLinkActive="active"
            class="nav-link"
            (click)="closeMenu()"
          >
            {{ link.label }}
          </a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--color-surface);
        border-bottom: 1px solid var(--color-surface-border);
      }

      .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-md) var(--spacing-lg);
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

      .nav {
        display: flex;
        gap: var(--spacing-xs);
      }

      .nav-link {
        padding: var(--spacing-sm) var(--spacing-md);
        color: var(--color-text-secondary);
        text-decoration: none;
        font-weight: 500;
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
      }

      .nav-link:hover {
        color: var(--color-text);
        background-color: var(--color-surface-light);
      }

      .nav-link.active {
        color: var(--color-accent);
        background-color: var(--color-accent-light);
      }

      /* Mobile Menu Button */
      .mobile-menu-btn {
        display: none;
        padding: var(--spacing-sm);
        background: none;
        border: none;
        cursor: pointer;
      }

      .hamburger {
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 24px;
      }

      .hamburger span {
        display: block;
        height: 2px;
        background-color: var(--color-text);
        border-radius: 2px;
        transition: all var(--transition-fast);
      }

      .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }

      .hamburger.active span:nth-child(2) {
        opacity: 0;
      }

      .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
      }

      /* Mobile Styles */
      @media (max-width: 768px) {
        .mobile-menu-btn {
          display: block;
        }

        .nav {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          flex-direction: column;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-surface-border);
          padding: var(--spacing-md);
          gap: var(--spacing-xs);
          display: none;
        }

        .nav.open {
          display: flex;
        }

        .nav-link {
          padding: var(--spacing-md);
        }
      }
    `,
  ],
})
export class HeaderComponent {
  protected readonly menuOpen = signal(false);

  protected readonly navLinks = [
    { path: '/create-wallet', label: 'Create Wallet' },
    { path: '/send', label: 'Send SFR' },
    { path: '/history', label: 'History' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
