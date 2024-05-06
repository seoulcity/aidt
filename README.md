# Introduction in English 
## SvelteKit + Tailwind CSS + Supabase Boilerplate 🚀

This boilerplate provides a quick and easy setup for building modern web applications using SvelteKit, Tailwind CSS, and Supabase. It comes preconfigured with essential libraries and tools to help you kickstart your project in no time! ⚡

## Features 🌟

- SvelteKit for building fast and lightweight web applications 🌐
- Tailwind CSS for rapid UI development with utility-first classes 🎨
- Supabase integration for seamless backend and database management 🗄️
- Environment variable setup for secure configuration 🔒
- Preconfigured project structure for easy navigation and development 📂

## Getting Started 🏁

1. Clone the repository:

```
git clone https://github.com/yourusername/sveltekit-tailwindcss-supabase-boilerplate.git
```

2. Install dependencies
```
cd sveltekit-tailwindcss-supabase-boilerplate
npm install
```
3. Set up environment variables:
Create a .env file in the root directory and add the following variables:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
4. Configure Vite:
Update the vite.config.js file with the following configuration:
```
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
});
```
5. Configure Nginx:
```
server {
  listen 80;
  server_name db.corp.reviews;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl;
  server_name YOUR_DOMAIN_NAME;
  ssl_certificate /your/letsencrypt/fullchain/key/path/fullchain.pem;
  ssl_certificate_key /your/letsencrypt/private/key/path/.pem;privkey.pem;

  location / {
    proxy_pass http://localhost:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # WebSocket 프록시 설정 추가
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```
6. Set up Supabase client:

Update the src/lib/supabaseClient.js file with the following code:
```
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```
7. Start the development server:
```
npm run dev
```

Your application should now be running at http://localhost:5173.
If you have an issue to access your application through local address, then try through network address instead.

## Documentation 📚
For more information on setting up and configuring the individual components of this boilerplate, refer to the following documentation:

- SvelteKit: https://tailwindcss.com/docs/guides/sveltekit
- Tailwind CSS: https://tailwindcss.com/docs/guides/sveltekit
- Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/sveltekit

## Project Structure 📁
```
.
├── README.md
├── package.json
├── postcss.config.js
├── src
│   ├── app.css
│   ├── app.html
│   ├── lib
│   │   ├── index.js
│   │   └── supabaseClient.js
│   └── routes
│       ├── +layout.svelte
│       ├── +page.server.js
│       └── +page.svelte
├── static
│   ├── favicon.png
│   ├── supabase.png
│   ├── svelte.png
│   └── tailwindcss.png
├── svelte.config.js
├── tailwind.config.js
└── vite.config.js
```
## Contributing 🤝
Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## License 📄
This project is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License. See the LICENSE file for more details.

---
# 한국어 소개
## SvelteKit + Tailwind CSS + Supabase 보일러플레이트 🚀

이 보일러플레이트는 SvelteKit, Tailwind CSS 및 Supabase를 사용하여 현대적인 웹 애플리케이션을 빠르고 쉽게 구축할 수 있도록 제공합니다. 필수 라이브러리와 도구가 사전 구성되어 있어 프로젝트를 빠르게 시작할 수 있습니다! ⚡

## 특징 🌟

- SvelteKit을 사용하여 빠르고 가벼운 웹 애플리케이션 구축 🌐
- Tailwind CSS를 사용하여 유틸리티 우선 클래스로 신속한 UI 개발 🎨
- Supabase 통합으로 원활한 백엔드 및 데이터베이스 관리 🗄️
- 안전한 구성을 위한 환경 변수 설정 🔒
- 쉬운 탐색 및 개발을 위한 사전 구성된 프로젝트 구조 📂

## 시작하기 🏁

1. 저장소 복제:

  git clone https://github.com/yourusername/sveltekit-tailwindcss-supabase-boilerplate.git

2. 종속성 설치:
```
  cd sveltekit-tailwindcss-supabase-boilerplate
  npm install
```
3. 환경 변수 설정:

  루트 디렉토리에 `.env` 파일을 생성하고 다음 변수를 추가합니다:
```
  VITE_SUPABASE_URL=your-supabase-url
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
  `your-supabase-project-id`와 `your-supabase-api-key`를 실제 Supabase 프로젝트 ID와 API 키로 대체합니다.
4. Vite 구성:
  `vite.config.js` 파일을 다음과 같이 업데이트합니다:
```
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
});
```
5. Nginx 구성:
  다음 내용으로 `/etc/nginx/sites-available/corpreviews-db.conf Nginx` 구성 파일을 생성합니다:
```
server {
  listen 80;
  server_name db.corp.reviews;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl;
  server_name db.corp.reviews;
  ssl_certificate /etc/letsencrypt/live/db.corp.reviews/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/db.corp.reviews/privkey.pem;

  location / {
    proxy_pass http://localhost:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # WebSocket 프록시 설정 추가
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```
6. Supabase 클라이언트 설정:
  src/lib/supabaseClient.js 파일을 다음과 같이 업데이트합니다:
```
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```
7. 개발 서버 시작:
```
  npm run dev
```
  이제 애플리케이션이 `http://localhost:5173`에서 실행되어야 합니다.
  로컬 어드레스 접근에 문제가 발생한다면, 네트워크 주소를 이용해 어플리케이션에 접근해보세요.s

## 문서 📚

이 보일러플레이트의 개별 구성 요소 설정 및 구성에 대한 자세한 내용은 다음 문서를 참조하세요:

- SvelteKit: [https://tailwindcss.com/docs/guides/sveltekit](https://tailwindcss.com/docs/guides/sveltekit)
- Tailwind CSS: [https://tailwindcss.com/docs/guides/sveltekit](https://tailwindcss.com/docs/guides/sveltekit)
- Supabase: [https://supabase.com/docs/guides/getting-started/quickstarts/sveltekit](https://supabase.com/docs/guides/getting-started/quickstarts/sveltekit)

## 프로젝트 구조 📁
```
.
├── README.md
├── package.json
├── postcss.config.js
├── src
│   ├── app.css
│   ├── app.html
│   ├── lib
│   │   ├── index.js
│   │   └── supabaseClient.js
│   └── routes
│       ├── +layout.svelte
│       ├── +page.server.js
│       └── +page.svelte
├── static
│   ├── favicon.png
│   ├── supabase.png
│   ├── svelte.png
│   └── tailwindcss.png
├── svelte.config.js
├── tailwind.config.js
└── vite.config.js
```
## 기여하기 🤝

기여를 환영합니다! 제안, 버그 보고 또는 기능 요청이 있는 경우 이슈를 열거나 풀 리퀘스트를 제출해 주세요.

## 라이선스 📄

이 프로젝트는 [크리에이티브 커먼즈 저작자표시 4.0 국제 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.ko) 라이선스에 따라 라이선스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
