import { Component, ChangeDetectionStrategy, signal, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SignupRequest, SignupResponse } from '../../core/models/api.interfaces';

type OnboardingStep = 'profile' | 'generating' | 'mnemonic' | 'complete';

@Component({
  selector: 'app-create-wallet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="onboarding-container">
        <!-- Progress indicator -->
        <div class="progress-bar">
          <div
            class="progress-step"
            [class.active]="currentStep() === 'profile'"
            [class.completed]="stepCompleted('profile')"
          >
            <span class="step-number">1</span>
            <span class="step-label">Profile</span>
          </div>
          <div class="progress-line" [class.active]="stepCompleted('profile')"></div>
          <div
            class="progress-step"
            [class.active]="currentStep() === 'generating'"
            [class.completed]="stepCompleted('generating')"
          >
            <span class="step-number">2</span>
            <span class="step-label">Generate</span>
          </div>
          <div class="progress-line" [class.active]="stepCompleted('generating')"></div>
          <div
            class="progress-step"
            [class.active]="currentStep() === 'mnemonic' || currentStep() === 'complete'"
            [class.completed]="stepCompleted('complete')"
          >
            <span class="step-number">3</span>
            <span class="step-label">Secure</span>
          </div>
        </div>

        <!-- Step 1: Profile Setup -->
        @if (currentStep() === 'profile') {
          <div class="card step-card">
            <h1 class="step-title">Create SIFRA Wallet</h1>
            <p class="step-description">Enter your details to create a secure blockchain wallet.</p>

            <form class="profile-form" (ngSubmit)="submitProfile()">
              <div class="form-group">
                <label for="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  [(ngModel)]="username"
                  name="username"
                  placeholder="Choose a username"
                  required
                  minlength="3"
                />
              </div>

              <div class="form-group">
                <label for="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div class="form-group">
                <label for="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Min 8 characters"
                  required
                  minlength="8"
                />
                @if (password && password.length < 8) {
                  <span class="field-error">Password must be at least 8 characters long</span>
                }
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  required
                />
                @if (password && confirmPassword && password !== confirmPassword) {
                  <span class="field-error">Passwords do not match</span>
                }
              </div>

              <div class="form-group">
                <label for="transactionPin">Transaction PIN *</label>
                <input
                  type="password"
                  id="transactionPin"
                  [(ngModel)]="transactionPin"
                  name="transactionPin"
                  placeholder="4-digit PIN for transactions"
                  required
                  maxlength="4"
                  pattern="[0-9]{4}"
                />
                <span class="field-hint">Required for all outgoing transfers</span>
              </div>

              @if (error()) {
                <div class="error-message">{{ error() }}</div>
              }

              <button
                type="submit"
                class="btn btn-primary btn-lg btn-block"
                [disabled]="!isFormValid()"
              >
                Create Wallet
              </button>
            </form>

            <p class="login-link">Already have an account? <a routerLink="/login">Login</a></p>
          </div>
        }

        <!-- Step 2: Generating Wallet -->
        @if (currentStep() === 'generating') {
          <div class="card step-card">
            <h1 class="step-title">Generating Your Wallet</h1>
            <p class="step-description">Creating your secure blockchain wallet...</p>

            <div class="generating-content">
              <div class="key-generation-container">
                <div class="key-animation-box">
                  <div class="key-label">Generating Keys</div>
                  <div class="key-display">
                    <span class="key-prefix">0x</span>
                    @for (char of animatedChars(); track $index) {
                      <span
                        class="key-char"
                        [class.stable]="char.stable"
                        [style.animation-delay]="char.delay + 'ms'"
                      >
                        {{ char.value }}
                      </span>
                    }
                  </div>
                  <div class="key-glow"></div>
                </div>

                <div class="generation-status">
                  <div class="status-indicator">
                    <span class="pulse-dot"></span>
                    <span class="status-text">{{ generationPhase() }}</span>
                  </div>
                  <p class="security-caption">🔐 Keys are generated securely on the blockchain</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Mnemonic Display (CRITICAL) -->
        @if (currentStep() === 'mnemonic') {
          <div class="card step-card mnemonic-card">
            <div class="warning-header">
              <span class="warning-icon-large">⚠️</span>
              <h1 class="step-title warning-title">SAVE YOUR RECOVERY PHRASE!</h1>
            </div>

            <div class="critical-warning">
              <p>
                <strong>IMPORTANT:</strong> This is the ONLY time you will see this information!
              </p>
              <p>Write down your 12-word recovery phrase and store it in a safe place.</p>
              <p>
                If you lose this phrase, you will <strong>permanently lose access</strong> to your
                funds!
              </p>
            </div>

            <!-- Mnemonic Words -->
            <div class="mnemonic-section">
              <h3>Your 12-Word Recovery Phrase</h3>
              <div class="mnemonic-words">
                @for (word of mnemonicWords(); track $index; let i = $index) {
                  <span class="word">{{ i + 1 }}. {{ word }}</span>
                }
              </div>
              <button class="btn btn-secondary btn-copy" (click)="copyMnemonic()">
                {{ copiedMnemonic() ? '✓ Copied!' : '📋 Copy Mnemonic' }}
              </button>
            </div>

            <!-- Private Key -->
            <div class="private-key-section">
              <h3>Your Private Key</h3>
              <p class="warning-text">⚠️ Never share this with anyone!</p>
              <div class="key-box">
                <code>{{ signupResponse()?.wallet?.private_key }}</code>
              </div>
              <button class="btn btn-secondary btn-copy" (click)="copyPrivateKey()">
                {{ copiedPrivateKey() ? '✓ Copied!' : '📋 Copy Private Key' }}
              </button>
            </div>

            <!-- Wallet Address -->
            <div class="address-section">
              <h3>Your Wallet Address</h3>
              <p class="info-text">Share this to receive SIFRA coins</p>
              <div class="key-box">
                <code>{{ signupResponse()?.wallet?.address }}</code>
              </div>
              <button class="btn btn-secondary btn-copy" (click)="copyAddress()">
                {{ copiedAddress() ? '✓ Copied!' : '📋 Copy Address' }}
              </button>
            </div>

            <!-- Confirmation -->
            <div class="confirmation-section">
              <label class="checkbox-container">
                <input type="checkbox" [(ngModel)]="mnemonicConfirmed" />
                <span class="checkmark"></span>
                <span class="checkbox-label"
                  >I have safely stored my recovery phrase and private key</span
                >
              </label>

              <button
                class="btn btn-primary btn-lg btn-block"
                [disabled]="!mnemonicConfirmed"
                (click)="onMnemonicConfirmed()"
              >
                I've Saved My Recovery Phrase → Continue
              </button>
            </div>
          </div>
        }

        <!-- Step 4: Complete -->
        @if (currentStep() === 'complete') {
          <div class="card step-card">
            <div class="success-header">
              <span class="success-icon">✓</span>
              <h1 class="step-title">Wallet Created Successfully!</h1>
            </div>

            <div class="wallet-details">
              <div class="detail-row">
                <label>Username</label>
                <span class="detail-value">{{ username }}</span>
              </div>

              <div class="detail-row">
                <label>Wallet Address</label>
                <div class="address-box">
                  <span class="detail-value mono address">{{
                    formatAddress(signupResponse()?.wallet?.address || '')
                  }}</span>
                </div>
              </div>

              <div class="security-note">
                <span class="note-icon">🔒</span>
                <span>Your wallet is ready. Remember to keep your recovery phrase safe!</span>
              </div>
            </div>

            <button class="btn btn-primary btn-lg btn-block" (click)="goToDashboard()">
              Continue to Dashboard
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-lg);
      }

      .onboarding-container {
        width: 100%;
        max-width: 600px;
      }

      /* Progress Bar */
      .progress-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--spacing-xl);
      }

      .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-xs);
      }

      .step-number {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--color-surface);
        border: 2px solid var(--color-surface-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: var(--color-text-muted);
        transition: all var(--transition-normal);
      }

      .progress-step.active .step-number,
      .progress-step.completed .step-number {
        background-color: var(--color-accent);
        border-color: var(--color-accent);
        color: var(--color-background);
      }

      .step-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .progress-step.active .step-label {
        color: var(--color-accent);
      }

      .progress-line {
        width: 60px;
        height: 2px;
        background-color: var(--color-surface-border);
        margin: 0 var(--spacing-sm);
        margin-bottom: 20px;
        transition: all var(--transition-normal);
      }

      .progress-line.active {
        background-color: var(--color-accent);
      }

      /* Step Card */
      .step-card {
        padding: var(--spacing-xl);
      }

      .step-title {
        text-align: center;
        margin-bottom: var(--spacing-sm);
      }

      .step-description {
        text-align: center;
        margin-bottom: var(--spacing-xl);
      }

      /* Profile Form */
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        margin-bottom: var(--spacing-sm);
        font-weight: 500;
      }

      .form-group input {
        padding: var(--spacing-md);
      }

      .field-error {
        color: var(--color-error);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      .error-message {
        padding: var(--spacing-md);
        background-color: rgba(255, 77, 77, 0.1);
        border: 1px solid var(--color-error);
        border-radius: var(--radius-md);
        color: var(--color-error);
        font-size: var(--font-size-sm);
      }

      .login-link {
        text-align: center;
        margin-top: var(--spacing-lg);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .login-link a {
        color: var(--color-accent);
        text-decoration: none;
      }

      /* Generating */
      .generating-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-xl);
      }

      .key-generation-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .key-animation-box {
        position: relative;
        background-color: var(--color-background);
        border: 1px solid var(--color-surface-border);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        overflow: hidden;
      }

      .key-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: var(--spacing-sm);
      }

      .key-display {
        font-family: 'Courier New', monospace;
        font-size: 14px;
        color: var(--color-accent);
        word-break: break-all;
        line-height: 1.8;
        min-height: 48px;
      }

      .key-prefix {
        color: var(--color-text-muted);
      }

      .key-char {
        display: inline-block;
        transition: all 0.15s ease;
        text-shadow: 0 0 8px rgba(42, 215, 146, 0.5);
        animation: charFlicker 0.1s ease-in-out infinite;
      }

      .key-char.stable {
        animation: none;
        text-shadow: 0 0 4px rgba(42, 215, 146, 0.3);
      }

      @keyframes charFlicker {
        0%,
        100% {
          opacity: 1;
          transform: translateY(0);
        }
        50% {
          opacity: 0.7;
          transform: translateY(-1px);
        }
      }

      .key-glow {
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(42, 215, 146, 0.1), transparent);
        animation: glowSweep 2s ease-in-out infinite;
      }

      @keyframes glowSweep {
        0% {
          left: -50%;
        }
        100% {
          left: 150%;
        }
      }

      .generation-status {
        text-align: center;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .pulse-dot {
        width: 10px;
        height: 10px;
        background-color: var(--color-accent);
        border-radius: 50%;
        animation: pulseDot 1s ease-in-out infinite;
      }

      @keyframes pulseDot {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.3);
          opacity: 0.7;
        }
      }

      .status-text {
        font-weight: 500;
        color: var(--color-accent);
      }

      .security-caption {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin: 0;
      }

      /* Mnemonic Section */
      .mnemonic-card {
        max-height: 90vh;
        overflow-y: auto;
      }

      .warning-header {
        text-align: center;
        margin-bottom: var(--spacing-xl);
      }

      .warning-icon-large {
        font-size: 64px;
        display: block;
        margin-bottom: var(--spacing-md);
      }

      .warning-title {
        color: var(--color-warning) !important;
      }

      .critical-warning {
        background-color: rgba(255, 184, 77, 0.15);
        border: 2px solid var(--color-warning);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
        color: var(--color-warning);
      }

      .critical-warning p {
        margin: var(--spacing-sm) 0;
      }

      .mnemonic-section,
      .private-key-section,
      .address-section {
        margin-bottom: var(--spacing-xl);
      }

      .mnemonic-section h3,
      .private-key-section h3,
      .address-section h3 {
        font-size: var(--font-size-md);
        margin-bottom: var(--spacing-md);
      }

      .mnemonic-words {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .word {
        background-color: var(--color-background);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        text-align: center;
        font-family: monospace;
        font-size: var(--font-size-sm);
        border: 1px solid var(--color-surface-border);
      }

      .warning-text {
        color: var(--color-warning);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-sm);
      }

      .info-text {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-sm);
      }

      .key-box {
        background-color: var(--color-background);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-surface-border);
        margin-bottom: var(--spacing-sm);
        word-break: break-all;
      }

      .key-box code {
        font-family: monospace;
        font-size: var(--font-size-sm);
        color: var(--color-accent);
      }

      .btn-copy {
        width: 100%;
      }

      .confirmation-section {
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-xl);
        border-top: 1px solid var(--color-surface-border);
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
        cursor: pointer;
      }

      .checkbox-container input[type='checkbox'] {
        width: 20px;
        height: 20px;
        accent-color: var(--color-accent);
      }

      .checkbox-label {
        flex: 1;
      }

      /* Success */
      .success-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
      }

      .success-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: var(--color-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: var(--color-background);
      }

      .wallet-details {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
      }

      .detail-row {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        padding: var(--spacing-md);
        background-color: var(--color-surface-light);
        border-radius: var(--radius-md);
      }

      .detail-row label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        color: var(--color-text);
        font-weight: 500;
      }

      .detail-value.mono {
        font-family: monospace;
        font-size: var(--font-size-sm);
      }

      .address {
        word-break: break-all;
      }

      .security-note {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background-color: var(--color-accent-light);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-accent);
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 768px) {
        .progress-line {
          width: 40px;
        }

        .step-label {
          display: none;
        }

        .mnemonic-words {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class CreateWalletComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Form fields
  protected username = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected transactionPin = '';
  protected mnemonicConfirmed = false;

  // State
  protected readonly currentStep = signal<OnboardingStep>('profile');
  protected readonly signupResponse = signal<SignupResponse | null>(null);
  protected readonly error = signal('');
  protected readonly copiedMnemonic = signal(false);
  protected readonly copiedPrivateKey = signal(false);
  protected readonly copiedAddress = signal(false);

  // Animation state
  protected readonly animatedChars = signal<
    Array<{ value: string; stable: boolean; delay: number }>
  >([]);
  protected readonly generationPhase = signal('Initializing...');

  private animationInterval: ReturnType<typeof setInterval> | null = null;
  private readonly hexChars = '0123456789abcdef';

  isFormValid(): boolean {
    return (
      this.username.length >= 3 &&
      this.email.includes('@') &&
      this.password.length >= 8 &&
      this.password === this.confirmPassword &&
      /^[0-9]{4}$/.test(this.transactionPin)
    );
  }

  submitProfile(): void {
    if (!this.isFormValid()) return;

    this.error.set('');
    this.currentStep.set('generating');
    this.startGeneratingAnimation();

    const signupData: SignupRequest = {
      username: this.username,
      email: this.email,
      password: this.password,
      confirm_password: this.confirmPassword,
      transaction_pin: this.transactionPin,
    };

    // Update phases during "animation"
    setTimeout(() => this.generationPhase.set('Generating cryptographic keys...'), 500);
    setTimeout(() => this.generationPhase.set('Computing public address...'), 1500);
    setTimeout(() => this.generationPhase.set('Registering wallet on blockchain...'), 2500);

    this.authService.signup(signupData).subscribe({
      next: (response) => {
        this.signupResponse.set(response);
        // Wait for animation to complete, then show mnemonic
        setTimeout(() => {
          this.clearAnimation();
          this.currentStep.set('mnemonic');
        }, 3000);
      },
      error: (err) => {
        this.clearAnimation();
        this.currentStep.set('profile');
        this.error.set(
          err.error?.username?.[0] ||
            err.error?.email?.[0] ||
            err.error?.password?.[0] ||
            err.error?.non_field_errors?.[0] ||
            err.error?.detail ||
            'Signup failed. Please try again.',
        );
      },
    });
  }

  // Mnemonic words computed from response
  protected readonly mnemonicWords = () => {
    const mnemonic = this.signupResponse()?.wallet?.mnemonic;
    return mnemonic ? mnemonic.split(' ') : [];
  };

  async copyMnemonic(): Promise<void> {
    const mnemonic = this.signupResponse()?.wallet?.mnemonic;
    if (!mnemonic) return;

    try {
      await navigator.clipboard.writeText(mnemonic);
      this.copiedMnemonic.set(true);
      setTimeout(() => this.copiedMnemonic.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async copyPrivateKey(): Promise<void> {
    const privateKey = this.signupResponse()?.wallet?.private_key;
    if (!privateKey) return;

    try {
      await navigator.clipboard.writeText(privateKey);
      this.copiedPrivateKey.set(true);
      setTimeout(() => this.copiedPrivateKey.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async copyAddress(): Promise<void> {
    const address = this.signupResponse()?.wallet?.address;
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      this.copiedAddress.set(true);
      setTimeout(() => this.copiedAddress.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  onMnemonicConfirmed(): void {
    this.currentStep.set('complete');
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  stepCompleted(step: OnboardingStep): boolean {
    const steps: OnboardingStep[] = ['profile', 'generating', 'mnemonic', 'complete'];
    const currentIndex = steps.indexOf(this.currentStep());
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex;
  }

  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  }

  // Animation methods
  private startGeneratingAnimation(): void {
    const initialChars = this.generateRandomChars(40);
    this.animatedChars.set(
      initialChars.map((char, i) => ({
        value: char,
        stable: false,
        delay: i * 10,
      })),
    );

    let count = 0;
    this.animationInterval = setInterval(() => {
      count++;
      const stableCount = Math.floor(count / 3);

      this.animatedChars.update((chars) =>
        chars.map((char, index) => ({
          ...char,
          value: index < stableCount ? char.value : this.hexChars[Math.floor(Math.random() * 16)],
          stable: index < stableCount,
        })),
      );

      if (stableCount >= 40) {
        this.clearAnimation();
      }
    }, 80);
  }

  private generateRandomChars(length: number): string[] {
    const chars: string[] = [];
    for (let i = 0; i < length; i++) {
      chars.push(this.hexChars[Math.floor(Math.random() * 16)]);
    }
    return chars;
  }

  private clearAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.clearAnimation();
  }
}
