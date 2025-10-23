document.addEventListener('DOMContentLoaded', () => {
  const stepsData = [
    { step: "1단계", title: "양식, 일대기 작성", imgSrc: "image/first.svg", href: "intro.html" },
    { step: "2단계", title: "유아기, 청소년기", imgSrc: "image/second.svg", href: "life-summary.html?stage=child" },
    { step: "3단계", title: "성인기, 중년기", imgSrc: "image/third.svg", href: "life-summary.html?stage=adult" },
    { step: "4단계", title: "노년기", imgSrc: "image/fourth.svg", href: "life-summary.html?stage=senior" },
    { step: "5단계", title: "자서전 수정", imgSrc: "image/fifth.svg", href: "autobiography.html" }
  ];

  const roadContainer = document.querySelector('.road');
  const currentProgress = Number(localStorage.getItem('roadmapProgress')) || 0;
  console.log("📊 현재 진행 단계:", currentProgress);

  stepsData.forEach((data, index) => {
    const stepNumber = index + 1;
    const stageKey = `stageStatus_${stepNumber}`;
    const status = localStorage.getItem(stageKey);
    let stepHTML = '';

    if (stepNumber === currentProgress + 1) {
      stepHTML = `
        <div class="step active">
          <h3>${data.step}</h3>
          <p>${data.title}</p>
          <img src="${data.imgSrc}" alt="${data.title}">
          <a href="${data.href}" class="step_btn">
            ${status === 'in_progress' ? '이어서 하기' : '시작하기'}
          </a>
        </div>`;
    } else if (stepNumber <= currentProgress) {
      stepHTML = `
        <div class="step completed">
          <h3>${data.step}</h3>
          <p>${data.title}</p>
          <img src="image/check.svg" alt="완료">
          <button class="step_btn done" disabled>완료</button>
        </div>`;
    } else {
      const prevStep = stepNumber - 1;
      stepHTML = `
        <div class="step inactive">
          <h3>${data.step}</h3>
          <p>${data.title}</p>
          <img src="image/lock.svg" alt="잠김">
          <button class="step_btn" disabled>${prevStep}단계 진행하기</button>
        </div>`;
    }

    roadContainer.innerHTML += stepHTML;
  });

  // ✅ 초기 상태 저장 (forEach 밖)
  localStorage.setItem("stageStatus_1", "completed");
  localStorage.setItem("roadmapProgress", "1");

  // ✅ .preview 클릭 시 autobiography.html 이동
  document.addEventListener('click', (e) => {
    const previewEl = e.target.closest('.preview');
    if (previewEl) {
      window.location.href = 'autobiography.html';
    }
  });
}); // ← 여기서 깔끔히 닫힘!
