import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'recover',
    loadComponent: () =>
      import('./features/recover-key/recover-key').then((m) => m.RecoverKeyComponent),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/create-wallet/create-wallet').then((m) => m.CreateWalletComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'send',
    loadComponent: () => import('./features/send-sfr/send-sfr').then((m) => m.SendSfrComponent),
    canActivate: [authGuard],
  },
  {
    path: 'receive',
    loadComponent: () => import('./features/receive/receive').then((m) => m.ReceiveComponent),
    canActivate: [authGuard],
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history').then((m) => m.HistoryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'add-funds',
    loadComponent: () => import('./features/add-funds/add-funds').then((m) => m.AddFundsComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
