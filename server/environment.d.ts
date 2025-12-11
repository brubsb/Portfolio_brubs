declare namespace NodeJS {
    interface ProcessEnv {
      // Variáveis de ambiente padrão do Node.js
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
  
      // Variáveis de ambiente do projeto
      DATABASE_URL: string;
      SESSION_SECRET: string;
      ADMIN_PASSWORD: string;
      
      // Variáveis opcionais
      FRONTEND_URL?: string;
      SENDGRID_API_KEY?: string;
    }
  }
  