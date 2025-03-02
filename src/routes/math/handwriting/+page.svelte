<script lang="ts">
	import { onMount } from 'svelte';
	import { recognizeText } from '$lib/services/ocrService';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDrawing = false;
	let lastX = 0;
	let lastY = 0;

	let recognizedText: string[] = [];
	let isLoading = false;
	let error: string | null = null;
	let hasContent = false;

	let fileInput: HTMLInputElement;

	let latexText: string | null = null;
	let isLatexLoading = false;
	let latexContainer: HTMLDivElement | null = null;
	let renderedMathML: string | null = null;
	let previousLatexText: string | null = null;
	let isRendering = false;

	const sampleImages = [
		{ src: '/ocr_1.jpg', alt: '수식 예시 1' },
		{ src: '/ocr_2.jpg', alt: '수식 예시 2' },
		{ src: '/ocr_3.png', alt: '수식 예시 3' },
		{ src: '/ocr_4.jpg', alt: '수식 예시 4' }
		// 필요한 경우 더 많은 예시 이미지 추가
	];

	// 환경 변수에서 API URL 가져오기
	const API_URL = import.meta.env.PUBLIC_API_URL || 'http://175.106.97.53:8000';

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		adjustCanvasSize();
		setWhiteBackground();
		
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 12;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.shadowColor = '#000000';
		ctx.shadowBlur = 1;
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		window.addEventListener('resize', adjustCanvasSize);
		return () => window.removeEventListener('resize', adjustCanvasSize);
	});

	function adjustCanvasSize() {
		const container = canvas.parentElement;
		if (container) {
			const rect = container.getBoundingClientRect();
			canvas.width = rect.width;
			canvas.height = rect.height;
			setWhiteBackground();
		}
	}

	function setWhiteBackground() {
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		hasContent = false;
	}

	function startDrawing(e: MouseEvent | TouchEvent) {
		isDrawing = true;
		const pos = getPosition(e);
		lastX = pos.x;
		lastY = pos.y;
	}

	function draw(e: MouseEvent | TouchEvent) {
		if (!isDrawing) return;
		e.preventDefault();

		const pos = getPosition(e);
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();

		lastX = pos.x;
		lastY = pos.y;
		hasContent = true;
	}

	function stopDrawing() {
		isDrawing = false;
	}

	function getPosition(e: MouseEvent | TouchEvent) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		if ('touches' in e) {
			return {
				x: (e.touches[0].clientX - rect.left) * scaleX,
				y: (e.touches[0].clientY - rect.top) * scaleY
			};
		}
		return {
			x: ((e as MouseEvent).clientX - rect.left) * scaleX,
			y: ((e as MouseEvent).clientY - rect.top) * scaleY
		};
	}

	function clearCanvas() {
		setWhiteBackground();
	}

	function downloadImage() {
		const link = document.createElement('a');
		link.download = 'math-handwriting.png';
		link.href = canvas.toDataURL();
		link.click();
	}

	async function recognizeHandwriting() {
		try {
			isLoading = true;
			error = null;

			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = canvas.width * 2;
			tempCanvas.height = canvas.height * 2;
			const tempCtx = tempCanvas.getContext('2d')!;
			
			tempCtx.fillStyle = '#FFFFFF';
			tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
			
			tempCtx.imageSmoothingEnabled = true;
			tempCtx.imageSmoothingQuality = 'high';
			
			tempCtx.scale(2, 2);
			tempCtx.drawImage(canvas, 0, 0);

			const imageData = tempCanvas.toDataURL('image/png', 1.0);
			console.log('Starting OCR recognition...');
			recognizedText = await recognizeText(imageData);
			console.log('OCR recognition completed:', recognizedText);
		} catch (e) {
			console.error('Recognition error:', e);
			error = e instanceof Error ? e.message : '인식 중 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		try {
			isLoading = true;
			error = null;

			// 이미지 파일인지 확인
			if (!file.type.startsWith('image/')) {
				throw new Error('이미지 파일만 업로드할 수 있습니다.');
			}

			// 파일을 base64로 변환
			const reader = new FileReader();
			const imageData = await new Promise<string>((resolve, reject) => {
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
				reader.readAsDataURL(file);
			});

			// 이미지를 캔버스에 그리기
			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = () => reject(new Error('이미지를 로드하는 중 오류가 발생했습니다.'));
				img.src = imageData;
			});

			// 캔버스 크기 조정 및 이미지 그리기
			const aspectRatio = img.width / img.height;
			const maxWidth = canvas.width;
			const maxHeight = canvas.height;
			
			let width = maxWidth;
			let height = width / aspectRatio;
			
			if (height > maxHeight) {
				height = maxHeight;
				width = height * aspectRatio;
			}
			
			const x = (maxWidth - width) / 2;
			const y = (maxHeight - height) / 2;

			setWhiteBackground();
			ctx.drawImage(img, x, y, width, height);
			hasContent = true;

		} catch (e) {
			console.error('Upload error:', e);
			error = e instanceof Error ? e.message : '파일 처리 중 오류가 발생했습니다.';
		} finally {
			isLoading = false;
			// 파일 입력 초기화
			fileInput.value = '';
		}
	}

	async function loadAndRecognizeImage(src: string) {
		try {
			isLoading = true;
			error = null;

			// 이미지 로드
			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = () => reject(new Error('이미지를 로드하는 중 오류가 발생했습니다.'));
				img.src = src;
			});

			// 캔버스에 이미지 그리기
			const aspectRatio = img.width / img.height;
			const maxWidth = canvas.width;
			const maxHeight = canvas.height;
			
			let width = maxWidth;
			let height = width / aspectRatio;
			
			if (height > maxHeight) {
				height = maxHeight;
				width = height * aspectRatio;
			}
			
			const x = (maxWidth - width) / 2;
			const y = (maxHeight - height) / 2;

			setWhiteBackground();
			ctx.drawImage(img, x, y, width, height);
			hasContent = true;

		} catch (e) {
			console.error('Image loading error:', e);
			error = e instanceof Error ? e.message : '이미지 처리 중 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}

	async function recognizeLatex() {
		try {
			isLatexLoading = true;
			error = null;

			const blob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					resolve(blob!);
				}, 'image/png');
			});

			const formData = new FormData();
			formData.append('file', blob, 'equation.png');

			// API_URL 사용
			const response = await fetch(`${API_URL}/recognize-latex`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('LaTeX 인식 중 오류가 발생했습니다.');
			}

			const data = await response.json();
			latexText = data.latex;
		} catch (e) {
			console.error('LaTeX recognition error:', e);
			error = e instanceof Error ? e.message : 'LaTeX 인식 중 오류가 발생했습니다.';
		} finally {
			isLatexLoading = false;
		}
	}

	async function renderLatex() {
		if (!latexText || isRendering || latexText === previousLatexText) return;

		try {
			isRendering = true;
			previousLatexText = latexText;
			console.log('✅ LaTeX 렌더링 시작:', latexText);
			
			const response = await fetch(`${API_URL}/render-latex`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ latex: latexText })
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.detail || 'LaTeX 렌더링 중 오류가 발생했습니다.');
			}

			if (typeof data.mathml === 'string' && latexContainer) {
				renderedMathML = data.mathml;
				latexContainer.innerHTML = data.mathml;
				console.log('✅ MathML 렌더링 완료');
			} else {
				throw new Error('서버에서 잘못된 형식의 응답을 받았습니다.');
			}
		} catch (e) {
			console.error('🚨 LaTeX 렌더링 오류:', e);
			if (latexContainer) {
				latexContainer.innerHTML = '<p style="color: red;">LaTeX 렌더링 오류</p>';
			}
		} finally {
			isRendering = false;
		}
	}

	// onMount에서 초기 렌더링 시도
	onMount(() => {
		console.log('🟢 Component mounted');
		if (latexContainer && latexText) {
			renderLatex();
		}
	});

	// latexText가 변경될 때만 렌더링
	$: if (latexText !== previousLatexText) {
		console.log('🔄 LaTeX 텍스트 변경됨:', latexText);
		renderLatex();
	}
</script>

<svelte:head>
	<style>
		/* MathML 스타일링 */
		math {
			font-size: 1.2em;
			font-family: STIX-Web, STIX Two Math, STIX, STIXGeneral, DejaVu Serif, DejaVu Sans, Cambria Math, Latin Modern Math, Georgia, Times, serif;
		}
		
		.latex-output {
			overflow-x: auto;
			padding: 1rem;
			background: white;
			border-radius: 0.5rem;
			box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		}
	</style>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold text-gray-900">수식 필기 인식</h1>
			<a href="/" class="text-blue-500 hover:text-blue-600 flex items-center gap-1">
				<span class="material-symbols-rounded">arrow_back</span>
				돌아가기
			</a>
		</div>

		<div class="bg-white rounded-lg shadow-md p-6">
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">예시 이미지로 시작하기</h2>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
					{#each sampleImages as image}
						<button
							class="relative group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
							on:click={() => loadAndRecognizeImage(image.src)}
						>
							<img
								src={image.src}
								alt={image.alt}
								class="w-full h-auto object-cover group-hover:opacity-90 transition-opacity"
							/>
							<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all">
								<span class="material-symbols-rounded text-white opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
									document_scanner
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<div class="border-t border-gray-200 my-6"></div>

			<div class="mb-4">
				<div class="flex items-center gap-4 mb-4">
					<h2 class="text-lg font-semibold text-gray-800">이미지 업로드 또는 직접 그리기</h2>
					<input
						type="file"
						accept="image/*"
						class="hidden"
						bind:this={fileInput}
						on:change={handleFileUpload}
					/>
					<button
						on:click={() => fileInput.click()}
						class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
					>
						<span class="material-symbols-rounded">upload</span>
						이미지 업로드
					</button>
				</div>
			</div>

			<div class="mb-4 relative">
				<div class="absolute inset-0 bg-white rounded-lg"></div>
				<canvas
					bind:this={canvas}
					class="relative z-10 border border-gray-300 rounded-lg w-full h-[400px] touch-none"
					on:mousedown={startDrawing}
					on:mousemove={draw}
					on:mouseup={stopDrawing}
					on:mouseleave={stopDrawing}
					on:touchstart={startDrawing}
					on:touchmove={draw}
					on:touchend={stopDrawing}
				/>
			</div>

			<div class="flex gap-4 mb-4">
				<button
					on:click={clearCanvas}
					class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
				>
					<span class="material-symbols-rounded">delete</span>
					지우기
				</button>
				<button
					on:click={downloadImage}
					class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
				>
					<span class="material-symbols-rounded">download</span>
					다운로드
				</button>
				<button
					on:click={recognizeHandwriting}
					disabled={isLoading || !hasContent}
					class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="material-symbols-rounded">
						{isLoading ? 'hourglass_empty' : 'document_scanner'}
					</span>
					{isLoading ? '인식 중...' : 'CLOVA OCR'}
				</button>
				<button
					on:click={recognizeLatex}
					disabled={isLatexLoading || !hasContent}
					class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="material-symbols-rounded">
						{isLatexLoading ? 'hourglass_empty' : 'functions'}
					</span>
					{isLatexLoading ? 'LaTeX 변환 중...' : 'LaTeX 변환'}
				</button>
			</div>

			<div class="space-y-2 text-sm text-gray-600 mb-4">
				<p>* 수식을 크고 명확하게 작성해주세요. 여러 줄로 작성할 수 있습니다.</p>
				<p>* 이미지 파일을 업로드하거나 캔버스에 직접 그려서 인식할 수 있습니다.</p>
			</div>

			{#if error}
				<div class="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
					{error}
				</div>
			{/if}

			{#if recognizedText.length > 0}
				<div class="mt-4 p-4 bg-gray-50 rounded-lg">
					<h3 class="font-semibold mb-2">인식된 텍스트:</h3>
					<div class="space-y-1">
						{#each recognizedText as text}
							<p>{text}</p>
						{/each}
					</div>
				</div>
			{/if}

			{#if latexText}
				<div class="mt-4 p-4 bg-gray-50 rounded-lg">
					<h3 class="font-semibold mb-2">인식된 LaTeX:</h3>
					<div class="font-mono bg-white p-3 rounded border border-gray-200 overflow-x-auto">
						{latexText}
					</div>
					<!-- MathJax이 렌더링될 div -->
					<div 
						class="mt-4 bg-white p-3 rounded border border-gray-200 overflow-x-auto latex-output" 
						bind:this={latexContainer}
					></div>
				</div>
			{/if}
		</div>
	</div>
</div> 