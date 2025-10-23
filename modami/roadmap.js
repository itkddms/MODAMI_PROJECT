document.addEventListener('DOMContentLoaded', () => {
  const stepsData = [
  { step: "1단계", title: "양식, 일대기 작성", imgSrc: "image/first.svg", href: "intro.html" },
  { step: "2단계", title: "유아기, 청소년기", imgSrc: "image/second.svg", href: "life-summary.html?stage=child" },
  { step: "3단계", title: "성인기, 중년기", imgSrc: "image/third.svg", href: "life-summary.html?stage=adult" },
  { step: "4단계", title: "노년기", imgSrc: "image/fourth.svg", href: "life-summary.html?stage=senior" },
    { step: "5단계", title: "자서전 수정", imgSrc: "image/fifth.svg", href: "autobiography.html" }
  ];

  const roadContainer = document.querySelector('.road');

  // ✅ 안전하게 숫자 변환
  const currentProgress = Number(localStorage.getItem('roadmapProgress')) || 0;
  console.log("📊 현재 진행 단계:", currentProgress);

  stepsData.forEach((data, index) => {
    const stepNumber = index + 1;
    const stageKey = `stageStatus_${stepNumber}`;
    const status = localStorage.getItem(stageKey); // 'in_progress', 'completed' 등

    let stepHTML = '';

    if (stepNumber === currentProgress + 1) {
      // 🔹 현재 진행해야 할 단계
      stepHTML = `
        <div class="step active">
          <h3>${data.step}</h3>
          <p>${data.title}</p>
          <img src="${data.imgSrc}" alt="${data.title}">
          <a href="${data.href}" class="step_btn">
            ${status === 'in_progress' ? '이어서 하기' : '시작하기'}
          </a>
        </div>
      `;
    } else if (stepNumber <= currentProgress) {
      // ✅ 완료된 단계
      stepHTML = `
        <div class="step completed">
          <h3>${data.step}</h3>
          <p>${data.title}</p>
          <img src="image/check.svg" alt="완료">
          <button class="step_btn done" disabled>완료</button>
        </div>
      `;
    } else {
      // 🔒 잠긴 단계
      const prevStep = stepNumber - 1; // 이전 단계 번호 계산
      stepHTML = `
        <div class="step inactive">
          <h3>${data.step}</h3>
          <p>${data.title}</p>
          <img src="image/lock.svg" alt="잠김">
          <button class="step_btn" disabled>${prevStep}단계 진행하기</button>
        </div>
      `;
    }
      localStorage.setItem("stageStatus_1", "completed");
localStorage.setItem("roadmapProgress", "1");


    roadContainer.innerHTML += stepHTML;
  });
});
