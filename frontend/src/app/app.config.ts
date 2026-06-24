import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider, SOCIAL_AUTH_CONFIG } from '@abacritt/angularx-social-login';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { Chart } from 'chart.js';
import { authInterceptor } from './services/auth/auth-interceptor';

Chart.register({
  id: 'centerTextPlugin',
  beforeDraw: function(chart: any) {
    if (chart.config.type !== 'doughnut') return;
    
    const width = chart.width;
    const height = chart.height;
    const ctx = chart.ctx;

    ctx.restore();
    const fontSize = (height / 8).toFixed(2);
    ctx.font = `bold ${fontSize}px 'Playfair Display', serif`;
    ctx.textBaseline = "middle";
    
    // Try to get primary color from CSS variables, fallback to a theme color
    let textColor = '#8C7B72';
    try {
      const docStyle = getComputedStyle(document.documentElement);
      const primary = docStyle.getPropertyValue('--primary').trim();
      if (primary) textColor = primary;
    } catch(e) {}
    
    ctx.fillStyle = textColor;

    let sum = 0;
    if (chart.config.data.datasets && chart.config.data.datasets.length > 0) {
        sum = chart.config.data.datasets[0].data.reduce((a: number, b: number) => a + Number(b), 0);
    }
    
    // Only display center text if there is actually data
    if (sum >= 0) {
      const text = sum.toLocaleString();
      const chartArea = chart.chartArea;
      const textX = chartArea.left + (chartArea.right - chartArea.left) / 2;
      const textY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;
      
      ctx.textAlign = 'center';
      ctx.fillText(text, textX, textY);
    }
    ctx.save();
  }
});

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('YOUR_GOOGLE_CLIENT_ID')
          }
        ],
        onError: (err) => {
          console.error('Google Auth Error:', err);
        }
      } as SocialAuthServiceConfig,
    }
  ]
};
