<!-- src/routes/api-test/+page.svelte -->
<script lang="ts">
    import katex from 'katex';
    import { onMount } from 'svelte';
    
    // Import components
    import AreaStatus from '../../components/sbiz/AreaStatus.svelte';
    import BusinessTypeStatus from '../../components/sbiz/BusinessTypeStatus.svelte';
    import NearbyTrends from '../../components/sbiz/NearbyTrends.svelte';
    import SNSStatus from '../../components/sbiz/SNSStatus.svelte';

    let activeSection = '관심지역 현황';
    
    // KaTeX 수식 렌더링을 위한 함수
    function renderMath() {
      const mathElements = document.querySelectorAll('.math');
      mathElements.forEach(el => {
        katex.render(el.textContent, el, {
          throwOnError: false,
          displayMode: true
        });
      });
    }

    onMount(() => {
      renderMath();
    });
</script>
  
<div class="container mx-auto p-6">
  <!-- Navigation Buttons -->
  <div class="flex flex-wrap justify-center gap-2 mb-6">
    <button on:click={() => activeSection = '관심지역 현황'} 
            class={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === '관심지역 현황' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
      관심지역 현황
    </button>
    <button on:click={() => activeSection = '관심업종 현황'} 
            class={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === '관심업종 현황' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
      관심업종 현황
    </button>
    <button on:click={() => activeSection = '인근 상권 요즘 트렌드'} 
            class={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === '인근 상권 요즘 트렌드' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
      인근 상권 요즘 트렌드
    </button>
    <button on:click={() => activeSection = '내 지역 SNS 현황'} 
            class={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === '내 지역 SNS 현황' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
      내 지역 SNS 현황
    </button>
  </div>

  <!-- Content based on active section -->
  {#if activeSection === '관심지역 현황'}
    <AreaStatus />
  {/if}
  
  {#if activeSection === '관심업종 현황'}
    <BusinessTypeStatus />
  {/if}
  
  {#if activeSection === '인근 상권 요즘 트렌드'}
    <NearbyTrends />
  {/if}
  
  {#if activeSection === '내 지역 SNS 현황'}
    <SNSStatus />
  {/if}
</div>