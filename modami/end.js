document.addEventListener('DOMContentLoaded', () => {
    // ====== 전역 변수 ======
    let currentAudio = null;
    let currentTextIndex = 0;
    let typingInterval = null;
    let nextTextTimeout = null;
    const textElements = [
        { id: "text1", tts: "오늘 이야기 정말 잘 들었어요. 이제 마무리할 시간이네요." },
        { id: "text2", tts: "소중한 이야기 들려주셔서 감사드리고, 다음 단계에서 다시 뵐게요. 고생하셨습니다!" }
    ];

    // ====== DOM 요소 ======
    const nextBtn = document.querySelector('.nextbtn');
    const startBtn = document.querySelector('.start-btn');
    const texts = textElements.map(item => document.getElementById(item.id));

    // 초기 텍스트 숨기기
    texts.forEach(el => {
        el.dataset.original = el.innerHTML;
        if(el.id !== 'text1') { // 첫번째 텍스트는 보이지 않도록 함
            el.style.display = 'none';
        }
        el.innerHTML = '';
    });
    
    // 시작 버튼 초기 상태
    if(startBtn) {
        startBtn.style.display = 'block';
        if (nextBtn) { // 처음에는 다음 버튼 숨기기
            nextBtn.style.display = 'none';
        }
    }

    // ====== TTS 실행 함수 ======
    async function getTtsAudio(textScript) {
        const apiKey = "AIzaSyBKLaoIvgJ-ch0wZSPIxm5HhqJLvGRIbNM";
        const apiUrl = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;

        const payload = {
            input: { text: textScript },
            voice: {
                languageCode: "ko-KR",
                name: "ko-KR-Chirp3-HD-Zephyr"
            },
           audioConfig: { 
                audioEncoding: "MP3",
                speakingRate: 1.1
            }
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error(`API Error: ${response.status} - ${response.statusText}`);
                console.error(await response.text());
                return null;
            }

            const result = await response.json();
            const audioContent = result?.audioContent;

            if (audioContent) {
                const audioUrl = `data:audio/mp3;base64,${audioContent}`;
                const audio = new Audio(audioUrl);
                return new Promise((resolve, reject) => {
                    audio.addEventListener('loadedmetadata', () => {
                        resolve({ audio, duration: audio.duration });
                    });
                    audio.addEventListener('error', (err) => {
                        reject(err);
                    });
                });
            }
            return null;
        } catch (error) {
            console.error("TTS API 호출 오류:", error);
            return null;
        }
    }

    // ====== 순차 실행 함수 ======
    function showNextText() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        clearTimeout(nextTextTimeout);
        if (typingInterval) {
            clearInterval(typingInterval);
        }

        // 마지막 텍스트까지 재생이 끝났을 경우
        if (currentTextIndex >= texts.length) {
            // 여기에 추가적인 동작을 넣을 수 있습니다.
            // 예를 들어, 다음 버튼을 숨기는 등
            if (nextBtn) {
                nextBtn.style.display = 'none';
            }
            console.log("모든 텍스트 재생이 완료되었습니다.");
            return; // 페이지 이동을 막기 위해 return
        }

        if (currentTextIndex > 0) {
            texts[currentTextIndex - 1].style.display = 'none';
        }
        const currentElement = texts[currentTextIndex];
        const { tts } = textElements[currentTextIndex];
        typeWriter(currentElement, currentElement.dataset.original, tts);

        currentTextIndex++;
    }

    // ====== 타이핑 효과 함수 ======
    async function typeWriter(element, text, ttsScript) {
        element.style.display = 'block';
        element.innerHTML = '';
        element.classList.add('fade-in');

        const audioData = await getTtsAudio(ttsScript);
        if (!audioData) {
            console.error("오디오 데이터 로드 실패, 타이핑을 시작할 수 없습니다.");
            return;
        }

        const { audio, duration } = audioData;
        currentAudio = audio;
        const pureText = text.replace(/<br>/g, ' ').replace(/<[^>]*>/g, '');
        const totalChars = pureText.length;

        audio.play().catch(e => {
             console.error("Audio playback failed:", e);
        });

        let i = 0;
        let typedChars = 0;

        typingInterval = setInterval(() => {
            if (audio.paused || audio.ended) {
                clearInterval(typingInterval);
                element.classList.remove('fade-in');
                if (audio.ended) {
                    nextTextTimeout = setTimeout(showNextText, 10);
                }
                return;
            }

            const elapsedTime = audio.currentTime;
            const charsToType = Math.floor(elapsedTime * (totalChars / duration));

            while (typedChars < charsToType && i < text.length) {
                if (text.charAt(i) === '<') {
                    const tagEnd = text.indexOf('>', i);
                    if (tagEnd !== -1) {
                        element.innerHTML += text.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                    } else {
                        element.innerHTML += `<span>${text.charAt(i)}</span>`;
                        i++;
                        typedChars++;
                    }
                } else {
                    element.innerHTML += `<span>${text.charAt(i)}</span>`;
                    i++;
                    typedChars++;
                }
            }
        }, 10);
    }

    // ====== 이벤트 리스너 ======
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'block';
            showNextText();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showNextText();
        });
    }
});