<script>
    export let subject;
</script>

<a 
    href="/admin/{subject.id}"
    class="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
>
    <div class="text-4xl mb-4">{subject.icon}</div>
    <h2 class="text-xl font-semibold mb-2 text-gray-900">{subject.title}</h2>
    <p class="text-gray-600">{subject.description}</p>
    <div class="mt-4 flex justify-end">
        <span class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${subject.color === 'orange' ? 'bg-orange-100 text-orange-800' :
            subject.color === 'green' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'}`}>
            관리하기
        </span>
    </div>
</a> 