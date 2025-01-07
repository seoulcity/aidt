<script>
    import { page } from '$app/stores';
    
    export let currentSubject;
    export let isSubjectRoute;

    const navItems = [
        { path: 'students', label: '학생 관리' },
        { path: 'contents', label: '컨텐츠 관리' },
        { path: 'assessments', label: '평가 관리' }
    ];
</script>

<nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex">
                <div class="flex-shrink-0 flex items-center">
                    <a href="/admin" class="text-xl font-bold text-gray-800">
                        AI다움 관리자 {#if currentSubject}- {currentSubject}{/if}
                    </a>
                </div>
                <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {#if isSubjectRoute}
                        {#each navItems as item}
                            <a 
                                href="/admin/{$page.params.subject}/{item.path}"
                                class="border-b-2 {$page.url.pathname.includes(`/${item.path}`) ? 'border-blue-500' : 'border-transparent'} hover:border-gray-300 text-gray-900 inline-flex items-center px-1 pt-1"
                            >
                                {item.label}
                            </a>
                        {/each}
                    {:else}
                        <span class="text-gray-500 inline-flex items-center px-1 pt-1">
                            과목을 선택해주세요
                        </span>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</nav> 