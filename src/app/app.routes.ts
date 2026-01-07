import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'create-wallet', pathMatch: 'full' },
  { 
    path: 'create-wallet', 
    loadComponent: () => import('./features/create-wallet/create-wallet').then(m => m.CreateWalletComponent) 
  },
  { 
    path: 'send', 
    loadComponent: () => import('./features/send-sfr/send-sfr').then(m => m.SendSfrComponent) 
  },
  { 
    path: 'history', 
    loadComponent: () => import('./features/history/history').then(m => m.HistoryComponent) 
  },
  { path: '**', redirectTo: 'create-wallet' }
];
