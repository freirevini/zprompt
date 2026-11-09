import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { EnhanceApi, HttpEnhanceApi } from './app/core/enhance-api';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    // Servidor local em server/, pelo proxy /api. Sem Vertex configurado, a resposta vira demonstração rotulada.
    { provide: EnhanceApi, useClass: HttpEnhanceApi },
  ],
}).catch((err) => console.error(err));
