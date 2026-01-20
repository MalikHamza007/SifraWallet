import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layouts/sidebar/sidebar';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    @if (showSidebar()) {
    <app-sidebar />
    }
    <main class="main-content" [class.with-sidebar]="showSidebar()">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .main-content {
        min-height: 100vh;
        transition: margin-left var(--transition-normal);
      }

      .main-content.with-sidebar {
        margin-left: 240px;
      }

      @media (max-width: 768px) {
        .main-content.with-sidebar {
          margin-left: 0;
          padding-bottom: 80px;
        }
      }
    `,
  ],
})
export class App {
  private readonly authService = inject(AuthService);

  // Show sidebar when user is authenticated
  protected readonly showSidebar = computed(() => this.authService.isAuthenticated());
}
