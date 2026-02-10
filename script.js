// ดึงพื้นที่หลัก (ท้องฟ้า) ที่ใช้แสดงดาวทั้งหมด
const space = document.getElementById('space');

// เก็บ id ของคำอธิษฐานที่กำลังเปิดดูใน modal
let currentWishId = null; 

// ฟังก์ชันสร้างดาว 1 ดวงจากข้อมูลที่รับมา
function createStar(name, text, color, size, isPublic, wishId, style = 'star1.png') {

    // ดึงพื้นที่แสดงดาวอีกครั้ง เพื่อป้องกันกรณี element ยังไม่โหลด
    const space = document.getElementById('space');
    if (!space) return;

    // element หลักของดาว 1 ดวง
    const star = document.createElement('div');
    star.className = 'star';

    // ส่วนที่เป็นตัวไอคอนดาว
    const starIcon = document.createElement('div');
    starIcon.className = 'star-icon';

    // รูปภาพดาว
    const img = document.createElement('img');
    img.src = `assets/images/star/${style}`;
    img.style.width = '100%';
    img.style.height = '100%';

    // ใส่รูปดาวเข้าไปในไอคอน
    starIcon.appendChild(img);

    // กำหนดสีดาว (ใช้ร่วมกับ CSS effect)
    starIcon.style.color = color;

    // ชื่อผู้เขียนคำอธิษฐาน (แสดงใต้ดาว)
    const starName = document.createElement('div');
    starName.className = 'star-name';
    starName.textContent = name;

    // รวมไอคอนดาวและชื่อเข้าเป็นดาว 1 ดวง
    star.appendChild(starIcon);
    star.appendChild(starName);

    // กำหนดขนาดดาว (สุ่ม หรือใช้ค่าที่ผู้ใช้เลือก)
    if (size === 'random' || size === '') {
        const randomSize = Math.floor(Math.random() * (48 - 16 + 1)) + 16;
        star.style.fontSize = randomSize + 'px';
    } else {
        star.style.fontSize = size;
    }

    // สุ่มตำแหน่งแนวนอนของดาว
    star.style.left = (Math.random() * 90 + 5) + 'vw';

    // กำหนดระยะเวลาการลอยของดาว
    const duration = Math.random() * 10 + 15;
    starIcon.style.animationDuration = duration + 's';
    star.style.animationDuration = duration + 's';

    // ถ้าเป็นดาวสาธารณะ สามารถคลิกเพื่อดูรายละเอียดได้
    if (isPublic === 'public') {
        star.style.cursor = 'pointer';
        star.onclick = (e) => {
            e.stopPropagation();
            openModal(name, text, wishId); 
        };
    }

    // เพิ่มดาวเข้าไปในพื้นที่ท้องฟ้า
    space.appendChild(star);
    
    // เริ่มเอฟเฟกต์จางหายก่อนดาวหายไป
    setTimeout(() => {
        star.classList.add('fade-out');
    }, (duration - 1.5) * 1000); 

    // ลบดาวออกจากหน้าจอเมื่อหมดเวลา
    setTimeout(() => {
        if (star.parentNode) star.remove();
    }, duration * 1000);
}

// ฟังก์ชันส่งคำอธิษฐานใหม่ไปเก็บในฐานข้อมูล
function sendWish() {

    // ดึงค่าจาก input ต่าง ๆ
    const nameInput = document.getElementById('userName');
    const textInput = document.getElementById('wishText');
    const colorInput = document.getElementById('starColor');
    const sizeInput = document.getElementById('starSize');
    const privacyInput = document.querySelector('input[name="privacy"]:checked');

    // ดึงรูปแบบดาวที่ผู้ใช้เลือก
    const styleInput = document.getElementById('starStyle');
    const starStyle = styleInput.value;

    // ตรวจสอบว่ามีข้อความคำอธิษฐานหรือไม่
    const text = textInput.value.trim();
    if (!text) {
        alert("กรุณาใส่คำอธิษฐานก่อนนะ ✨");
        return;
    }

    // ตั้งค่าข้อมูลคำอธิษฐาน
    const name = nameInput.value.trim() || "ผู้ไม่ประสงค์ออกนาม";
    const color = colorInput.value;
    const selectedSize = sizeInput.value;
    const privacy = privacyInput ? privacyInput.value : "public";

    // บันทึกข้อมูลคำอธิษฐานลง Firebase
    database.ref('wishes').push({
        name: name,
        text: text,
        color: color,
        size: selectedSize,
        style: starStyle,
        privacy: privacy,
        timestamp: Date.now()
    }).then(() => {
        // ล้างช่องข้อความหลังส่งสำเร็จ
        textInput.value = ""; 
        if(typeof playSound === 'function') playSound('sfx-launch');
    }).catch((err) => {
        console.error('Failed to send wish:', err);
    });
}

// ฟังก์ชันเปิด modal เพื่อดูรายละเอียดคำอธิษฐาน
function openModal(name, text, wishId) {

    // ถ้าไม่มี id จะไม่ทำงาน
    if (!wishId) return;

    // ยกเลิกการฟังข้อมูลของคำอธิษฐานก่อนหน้า
    if (currentWishId) {
        database.ref(`wishes/${currentWishId}/supports`).off();
    }

    // ตั้ง id คำอธิษฐานปัจจุบัน
    currentWishId = wishId;

    // ดึง element modal และรายการกำลังใจ
    const modal = document.getElementById('wishModal');
    const supportList = document.getElementById('supportList');

    if (!modal || !supportList) return;

    // แสดง modal
    modal.style.display = "block";

    // แสดงชื่อและข้อความคำอธิษฐาน
    document.getElementById('modalName').innerText = "จาก: " + name;
    document.getElementById('modalText').innerText = text;

    // ข้อความระหว่างโหลดข้อมูล
    supportList.innerHTML = '<p style="font-size:12px; color:#555;">กำลังดึงข้อความ...</p>';

    // ดึงข้อความให้กำลังใจจาก Firebase แบบเรียลไทม์
    database.ref(`wishes/${wishId}/supports`).on('value', (snapshot) => {
        supportList.innerHTML = "";

        // กรณียังไม่มีข้อความให้กำลังใจ
        if (!snapshot.exists()) {
            supportList.innerHTML = '<p style="font-size:12px; color:#555;">ยังไม่มีข้อความส่งต่อ... เป็นคนแรกที่ให้กำลังใจดูไหม?</p>';
            return;
        }

        // แสดงข้อความให้กำลังใจแต่ละรายการ
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const div = document.createElement('div');
            div.style = "background: rgba(255,255,255,0.07); padding: 10px; margin-bottom: 8px; border-radius: 12px; font-size: 13px; border-left: 3px solid #f1c40f; text-align: left;";
            div.innerHTML = `<span style="color:#f1c40f; font-size:11px; display:block; margin-bottom:3px;">เพื่อนรักแห่งดวงดาว :</span> ${data.message}`;
            supportList.appendChild(div);
        });

        // เลื่อนลงไปล่างสุดอัตโนมัติ
        supportList.scrollTop = supportList.scrollHeight;
    });
}

// ฟังก์ชันส่งข้อความให้กำลังใจ
function sendSupport() {
    const input = document.getElementById('supportInput');
    const message = input.value.trim();
    if (!message || !currentWishId) return;

    database.ref(`wishes/${currentWishId}/supports`).push({
        message: message,
        timestamp: Date.now()
    }).then(() => {
        input.value = ""; 
    });
}

// ฟังก์ชันเพิ่มจำนวนหัวใจให้คำอธิษฐาน
function giveHeart() {
    if (!currentWishId) return;
    database.ref(`wishes/${currentWishId}/hearts`).transaction((currentHearts) => {
        return (currentHearts || 0) + 1;
    });
    if (typeof playSound === 'function') playSound('sfx-heart');
}

// ทำงานเมื่อหน้าเว็บโหลดเสร็จ
window.onload = function() {

    // รูปแบบดาวที่ใช้สุ่มสำหรับดาวระบบ
    const starStyles = [
        'star1.png',
        'star2.png',
        'star3.png',
        'star4.png'
    ];

    // คำอธิษฐานจากระบบ
    const systemWishes = [
        ["ระบบ", "ขอให้เป็นวันที่สดใส", "#ffffff", "random", "public"],
        ["ระบบ", "ขอให้ทุกอย่างเป็นไปตามที่ต้องการ", "#ffffff", "random", "public"],
        ["ระบบ", "แค่นี้ก็เก่งมากแล้วนะ", "#ffffff", "random", "public"],
        ["ระบบ", "เราเชื่อในตัวแกนะ", "#ffffff", "random", "public"]
    ];

    // ปล่อยดาวระบบชุดแรก
    systemWishes.forEach((wish, i) => {
        setTimeout(() => {
            createStar(
                wish[0],
                wish[1],
                wish[2],
                wish[3],
                wish[4],
                "system-star",
                starStyles[Math.floor(Math.random() * starStyles.length)]
            );
        }, i * 2500); 
    });

    // สุ่มปล่อยดาวระบบเรื่อย ๆ
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * systemWishes.length);
        const wish = systemWishes[randomIndex];
        createStar(
            wish[0],
            wish[1],
            wish[2],
            "random",
            "public",
            "system-star",
            starStyles[Math.floor(Math.random() * starStyles.length)]
        );
    }, 6000); 
};

// ฟังก์ชันเปิด–ปิดเพลงพื้นหลัง
function toggleMusic() {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    if (music.paused) {
        music.play();
        music.volume = 0.1;
        btn.innerText = "🔊 ปิดเพลง";
    } else {
        music.pause();
        btn.innerText = "🔈 เปิดเพลง";
    }
}

// เปิดเพลงอัตโนมัติหลังผู้ใช้คลิกครั้งแรก
function enableAutoplay() {
    const music = document.getElementById('bg-music');
    if(!music) return;
    music.volume = 0.1; 
    music.play().then(() => {
        const btn = document.getElementById('music-toggle');
        if (btn) btn.innerHTML = "🔊 ปิดเพลง";
    }).catch(e => console.log("Autoplay blocked"));
}

document.addEventListener('click', enableAutoplay, { once: true });

// ฟังข้อมูลคำอธิษฐานใหม่จาก Firebase แบบเรียลไทม์
database.ref('wishes').on('child_added', (snapshot) => {
    const data = snapshot.val();
    const wishId = snapshot.key; 

    if (data.privacy === 'public') {
        createStar(
            data.name,
            data.text,
            data.color,
            data.size,
            'public',
            wishId,
            data.style || 'star1.png'
        );
    }
});

// ปิด modal คำอธิษฐาน
function closeModal() {
    const modal = document.getElementById('wishModal');
    if (modal) {
        modal.style.display = "none";
        if (currentWishId) {
            database.ref(`wishes/${currentWishId}/supports`).off();
        }
        currentWishId = null;
    }
}

// ปิด modal เมื่อคลิกนอกกรอบ
function closeModalOutside(event) {
    const modal = document.getElementById('wishModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ซ่อน / แสดงเมนู UI
function toggleUI() {
    const ui = document.querySelector('.ui-container');
    const btn = document.getElementById('toggle-ui-btn');
    ui.classList.toggle('hidden');
    if (ui.classList.contains('hidden')) {
        btn.innerHTML = "👁️ แสดงเมนู";
    } else {
        btn.innerHTML = "👁️ ซ่อนเมนู";
    }
}
