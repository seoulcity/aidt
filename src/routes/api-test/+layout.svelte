<!-- src/routes/api-test/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="flex h-screen">
  <!-- Navigation Sidebar -->
  <nav class="w-64 bg-gray-100 p-6 border-r">
    <h2 class="text-xl font-bold mb-6">ClaRIO</h2>
    <ul class="space-y-4">
      <li>
        <a 
          href="/api-test"
          class="block p-2 rounded {$page.url.pathname === '/api-test' ? 'bg-green-500 text-white' : 'hover:bg-gray-200'}"
        >
          ClaRIO API 배치 호출
        </a>
      </li>
      <li>
        <a 
          href="/api-test/result"
          class="block p-2 rounded {$page.url.pathname === '/api-test/result' ? 'bg-green-500 text-white' : 'hover:bg-gray-200'}"
        >
          API 호출 결과 조회
        </a>
      </li>
      <li>
        <a 
          href="/api-test/evaluation"
          class="block p-2 rounded {$page.url.pathname === '/api-test/evaluation' ? 'bg-green-500 text-white' : 'hover:bg-gray-200'}"
        >
          평가
        </a>
      </li>
    </ul>
  </nav>

  <!-- Main Content -->
  <div class="flex-1 overflow-auto">
    <slot />
  </div>
</div> 