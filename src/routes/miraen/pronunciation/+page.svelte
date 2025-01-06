<!-- src/routes/miraen/pronunciation/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';

    let recordingStatus = false;
    let audioBlob: Blob | null = null;
    let transcription = '';
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let timer: NodeJS.Timeout | null = null;
    let timeLeft = 15;
    let micPermission: PermissionState | null = null;
    
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
    };

    const requestMicrophonePermission = async () => {
        // 개발 환경에서 mediaDevices 폴리필
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }
        
        // getUserMedia 폴리필
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
                const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                
                if (!getUserMedia) {
                    console.error('이 브라우저는 마이크 기능을 지원하지 않습니다.');
                    alert('죄송합니다. 이 브라우저는 마이크 기능을 지원하지 않습니다.\n다른 브라우저(예: Chrome)를 사용해주세요.');
                    return Promise.reject(new Error('getUserMedia is not implemented'));
                }

                return new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }

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
        // 개발 환경에서 mediaDevices 폴리필
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }
        
        // getUserMedia 폴리필
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
                const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                
                if (!getUserMedia) {
                    console.error('이 브라우저는 마이크 기능을 지원하지 않습니다.');
                    alert('죄송합니다. 이 브라우저는 마이크 기능을 지원하지 않습니다.\n다른 브라우저(예: Chrome)를 사용해주세요.');
                    return Promise.reject(new Error('getUserMedia is not implemented'));
                }

                return new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }

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

    const submitAudio = async () => {
        // 오디오 제출 로직 구현 예정
    };
</script>

<div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">영어 발음 평가</h1>
    
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">발음 녹음하기</h2>
        
        <div class="space-y-4">
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
            {/if}

            <button
                class="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!audioBlob}
                on:click={submitAudio}
            >
                발음 평가하기
            </button>
        </div>
    </div>

    {#if transcription}
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-700 mb-4">평가 결과</h2>
            <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-gray-700">{transcription}</p>
            </div>
        </div>
    {/if}
</div> 