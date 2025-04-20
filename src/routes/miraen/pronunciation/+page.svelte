<!-- src/routes/miraen/pronunciation/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import ClovaSpeechRecognizer from '../../../components/ClovaSpeechRecognizer.svelte';
    import ClovaSpeechResult from '../../../components/ClovaSpeechResult.svelte';
    import PronunciationGuide from '../../../components/PronunciationGuide.svelte';
    import PronunciationExamples from '../../../components/PronunciationExamples.svelte';

    let recordingStatus = false;
    let audioBlob: Blob | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let timer: NodeJS.Timeout | null = null;
    let timeLeft = 15;
    let micPermission: PermissionState | null = null;
    let recognitionResult: any = null;
    let referenceText = "Nice to meet you.";
    let guideOpen = false;
    let examplesOpen = false;
    let selectedLanguage: 'Eng' | 'Kor' = 'Eng'; // 기본값은 영어
    
    // 언어별 기본 문장
    $: if (selectedLanguage === 'Kor' && referenceText === "Nice to meet you.") {
        referenceText = "안녕하세요. 만나서 반갑습니다.";
    } else if (selectedLanguage === 'Eng' && referenceText === "안녕하세요. 만나서 반갑습니다.") {
        referenceText = "Nice to meet you.";
    }
    
    onMount(() => {
        // 마이크 권한 상태 확인
        const checkPermission = async () => {
            try {
                const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                micPermission = permission.state;
                
                permission.addEventListener('change', (e) => {
                    micPermission = (e.target as PermissionStatus).state;
                });
            } catch (error) {
                console.error('권한 상태 확인 실패:', error);
            }
        };

        checkPermission();

        return () => {
            if (timer) clearInterval(timer);
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        };
    });

    const startTimer = () => {
        timeLeft = 15;
        timer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                stopRecording();
            }
        }, 1000);
    };

    const handleRecordingComplete = (blob: Blob) => {
        audioBlob = blob;
        // 새로운 녹음이 완료되면 이전 인식 결과 초기화
        recognitionResult = null;
    };

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            micPermission = 'granted';
            return true;
        } catch (error) {
            console.error('마이크 권한 오류:', error);
            micPermission = 'denied';
            alert('마이크 사용을 허용해야 녹음이 가능합니다.\n브라우저 설정에서 마이크 권한을 허용해주세요.');
            return false;
        }
    };

    const startRecording = async () => {
        // 권한이 없는 경우 권한 요청
        if (micPermission !== 'granted') {
            const permitted = await requestMicrophonePermission();
            if (!permitted) return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                stream.getTracks().forEach(track => track.stop());
                if (timer) clearInterval(timer);
                recordingStatus = false;
                audioChunks = [];
                handleRecordingComplete(audioBlob);
            };

            mediaRecorder.start();
            recordingStatus = true;
            startTimer();
        } catch (error) {
            console.error('녹음 시작 오류:', error);
            alert('녹음을 시작할 수 없습니다. 마이크 연결을 확인해주세요.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            if (timer) clearInterval(timer);
        }
    };

    const toggleRecording = async () => {
        if (recordingStatus) {
            stopRecording();
        } else {
            await startRecording();
        }
    };

    const handleRecognitionResult = (event: CustomEvent) => {
        recognitionResult = event.detail;
    };

    const handleError = (event: CustomEvent) => {
        alert(`음성 인식 오류: ${event.detail.message}`);
    };
    
    const handleSelectExample = (event: CustomEvent<string>) => {
        referenceText = event.detail;
    };
    
    // 언어 변경 시 녹음 및 결과 초기화
    function handleLanguageChange() {
        if (audioBlob) {
            audioBlob = null;
        }
        if (recognitionResult) {
            recognitionResult = null;
        }
    }
</script>

<div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">ClaBi 디지털교과서 솔루션 AI다움 영어 발음 평가</h1>
    
    <PronunciationGuide bind:isOpen={guideOpen} language={selectedLanguage} />
    
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-700">발음 녹음하기</h2>
            
            <div class="flex space-x-3">
                <div class="flex items-center space-x-2">
                    <input 
                        type="radio" 
                        id="lang-eng" 
                        name="language"
                        bind:group={selectedLanguage}
                        value="Eng"
                        on:change={handleLanguageChange}
                        class="w-4 h-4 text-blue-600"
                    >
                    <label for="lang-eng" class="text-sm font-medium text-gray-700">영어</label>
                </div>
                
                <div class="flex items-center space-x-2">
                    <input 
                        type="radio" 
                        id="lang-kor" 
                        name="language"
                        bind:group={selectedLanguage}
                        value="Kor"
                        on:change={handleLanguageChange}
                        class="w-4 h-4 text-blue-600"
                    >
                    <label for="lang-kor" class="text-sm font-medium text-gray-700">한국어</label>
                </div>
            </div>
        </div>
        
        <div class="space-y-4">
            <div class="mb-4">
                <div class="flex items-end justify-between mb-1">
                    <label for="referenceText" class="block text-sm font-medium text-gray-700">
                        평가 대상 문장 ({selectedLanguage === 'Eng' ? '영어' : '한국어'} 발음할 문장)
                    </label>
                    <div class="flex space-x-2">
                        <PronunciationExamples 
                            bind:showExamples={examplesOpen}
                            language={selectedLanguage}
                            on:select={handleSelectExample} 
                        />
                    </div>
                </div>
                <input
                    type="text"
                    id="referenceText"
                    bind:value={referenceText}
                    placeholder={selectedLanguage === 'Eng' ? "예: Nice to meet you." : "예: 안녕하세요. 만나서 반갑습니다."}
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p class="mt-1 text-sm text-gray-500">
                    정확한 발음 평가를 위해 {selectedLanguage === 'Eng' ? '영어' : '한국어'} 문장을 입력하거나 예시 문장을 선택하세요.
                </p>
            </div>

            <div class="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                {#if recordingStatus}
                    <div class="mb-4 text-lg font-semibold text-gray-700">
                        남은 시간: {timeLeft}초
                    </div>
                {/if}
                <button
                    class="w-16 h-16 rounded-full flex items-center justify-center {recordingStatus ? 'bg-red-500' : 'bg-blue-500'} text-white hover:opacity-90 transition-opacity"
                    on:click={toggleRecording}
                >
                    <span class="material-symbols-rounded text-3xl">
                        {recordingStatus ? 'stop' : 'mic'}
                    </span>
                </button>
                <div class="mt-4 text-sm text-gray-500">
                    {#if micPermission === 'denied'}
                        마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.
                    {:else if recordingStatus}
                        클릭하여 녹음 중지
                    {:else}
                        클릭하여 녹음 시작
                    {/if}
                </div>
            </div>

            {#if audioBlob}
                <div class="p-4 bg-gray-50 rounded-lg">
                    <audio controls src={URL.createObjectURL(audioBlob)} class="w-full">
                        <track kind="captions" />
                    </audio>
                </div>
                
                <ClovaSpeechRecognizer 
                    audioBlob={audioBlob}
                    language={selectedLanguage}
                    enableAssessment={true}
                    referenceText={referenceText}
                    enableGraph={true}
                    on:recognitionResult={handleRecognitionResult}
                    on:error={handleError}
                />
            {/if}
        </div>
    </div>

    {#if recognitionResult}
        <ClovaSpeechResult result={recognitionResult} />
    {/if}
</div> 