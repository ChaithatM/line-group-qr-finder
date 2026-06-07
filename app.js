const SHEET_CONFIG = {
  id: "1jsk1uh_D9DusdpjY_PyK2nTk0fF9mc-BfEoF1KSruT0",
  sheetName: "published_data",
};

const fallbackRecords = [
  {
    term: "1/2568",
    is_current_term: true,
    course_code: "GEN101",
    section: "01",
    teacher_name: "อ.สมชาย ใจดี",
    line_group_url: "https://line.me/R/ti/g/example-gen101-01",
    confirmed: true,
    status: "active",
    updated_at: "2026-06-06",
  },
  {
    term: "1/2568",
    is_current_term: true,
    course_code: "GEN101",
    section: "02",
    teacher_name: "อ.วราภรณ์ แสงดี",
    line_group_url: "",
    confirmed: true,
    status: "active",
    updated_at: "2026-06-06",
  },
  {
    term: "1/2568",
    is_current_term: true,
    course_code: "ENG202",
    section: "A",
    teacher_name: "อ.กิตติพงศ์ ศรีสุข",
    line_group_url: "https://line.me/R/ti/g/example-eng202-a",
    confirmed: true,
    status: "active",
    updated_at: "2026-06-06",
  },
  {
    term: "1/2568",
    is_current_term: true,
    course_code: "THA115",
    section: "03",
    teacher_name: "อ.ปัทมา วัฒนกุล",
    line_group_url: "",
    confirmed: true,
    status: "active",
    updated_at: "2026-06-06",
  },
  {
    term: "2/2567",
    is_current_term: false,
    course_code: "GEN101",
    section: "01",
    teacher_name: "อ.สมชาย ใจดี",
    line_group_url: "",
    confirmed: true,
    status: "active",
    updated_at: "2025-11-14",
  },
  {
    term: "2/2567",
    is_current_term: false,
    course_code: "LBA210",
    section: "B",
    teacher_name: "อ.นภาพร จันทร์เพ็ญ",
    line_group_url: "https://line.me/R/ti/g/example-lba210-b",
    confirmed: true,
    status: "active",
    updated_at: "2025-11-14",
  },
  {
    term: "1/2568",
    is_current_term: true,
    course_code: "LBA305",
    section: "01",
    teacher_name: "อ.ธนพล เกียรติไกร",
    line_group_url: "https://line.me/R/ti/g/example-lba305-01",
    confirmed: true,
    status: "inactive",
    updated_at: "2026-06-06",
  },
];

let records = [];

const elements = {
  termFilter: document.querySelector("#termFilter"),
  courseSearch: document.querySelector("#courseSearch"),
  sectionSearch: document.querySelector("#sectionSearch"),
  resetButton: document.querySelector("#resetButton"),
  dataStatus: document.querySelector("#dataStatus"),
  resultCount: document.querySelector("#resultCount"),
  cardsGrid: document.querySelector("#cardsGrid"),
  cardTemplate: document.querySelector("#cardTemplate"),
};

function uniqueTerms(items) {
  return [...new Set(items.map((item) => item.term).filter(Boolean))];
}

function getDefaultTerm() {
  return records.find((record) => record.is_current_term)?.term || uniqueTerms(records)[0] || "";
}

function setupTermFilter() {
  elements.termFilter.innerHTML = "";
  uniqueTerms(records).forEach((term) => {
    const option = document.createElement("option");
    option.value = term;
    option.textContent = term;
    elements.termFilter.append(option);
  });
  elements.termFilter.value = getDefaultTerm();
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function createQrDataUrl(seedText) {
  const size = 29;
  let seed = 0;

  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) % 2147483647;
  }

  function next() {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  }

  function isFinder(row, col, startRow, startCol) {
    const within = row >= startRow && row < startRow + 7 && col >= startCol && col < startCol + 7;
    if (!within) return false;
    const localRow = row - startRow;
    const localCol = col - startCol;
    const edge = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
    const center = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
    return edge || center;
  }

  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const finder =
        isFinder(row, col, 1, 1) ||
        isFinder(row, col, 1, size - 8) ||
        isFinder(row, col, size - 8, 1);
      const active = finder || next() > 0.62 || (row + col) % 11 === 0;
      if (active) {
        cells.push(`<rect x="${col}" y="${row}" width="1" height="1" rx="0.04" />`);
      }
    }
  }

  const label = seedText.replace(/[<&>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}">
      <rect width="${size}" height="${size}" fill="#fff"/>
      <g fill="#111827">${cells.join("")}</g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const normalized = normalize(value);
  return ["true", "yes", "y", "1", "ใช่", "ยืนยัน", "confirmed", "active"].includes(normalized);
}

function getCellValue(row, index) {
  const cell = row.c[index];
  return cell ? cell.f || cell.v || "" : "";
}

function normalizeHeader(value) {
  return normalize(value).replace(/\s+/g, "_");
}

function pickValue(source, aliases, defaultValue = "") {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (source[normalizedAlias] !== undefined && source[normalizedAlias] !== "") {
      return source[normalizedAlias];
    }
  }
  return defaultValue;
}

function convertDriveImageUrl(url) {
  const value = String(url || "").trim();
  const match = value.match(/\/d\/([^/]+)/) || value.match(/[?&]id=([^&]+)/);
  if (!match) return value;
  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`;
}

function mapSheetTableToRecords(table) {
  const headers = table.cols.map((col) => normalizeHeader(col.label || col.id));

  return table.rows
    .map((row) => {
      const source = {};
      headers.forEach((header, index) => {
        source[header] = getCellValue(row, index);
      });

      return {
        term: pickValue(source, ["term", "ภาคเรียน", "ภาคเรียนที่เปิดสอน"]),
        is_current_term: parseBoolean(
          pickValue(source, ["is_current_term", "current_term", "ภาคเรียนปัจจุบัน"]),
          false
        ),
        course_code: pickValue(source, ["course_code", "รหัสวิชา"]),
        section: pickValue(source, ["section", "กลุ่มเรียน", "กลุ่มเรียน_/_section"]),
        teacher_name: pickValue(source, ["teacher_name", "instructor_name", "ชื่ออาจารย์", "ชื่ออาจารย์ประจำกลุ่มเรียน"]),
        qr_image_url: convertDriveImageUrl(
          pickValue(source, [
            "qr_image_url",
            "line_group_qr_code_image",
            "qr_upload_file",
            "อัปโหลดรูป_line_group_qr_code",
            "กรุณาอัปโหลดรูป_line_group_qr_code",
          ])
        ),
        line_group_url: pickValue(source, ["line_group_url", "line_group_link", "ลิงก์เข้ากลุ่ม_line", "ลิงก์เข้ากลุ่ม_line_ถ้ามี"]),
        confirmed: parseBoolean(
          pickValue(source, ["confirmed", "confirmation", "ยืนยัน", "ข้าพเจ้ายืนยันว่าข้อมูลและ_qr_code_ถูกต้องสำหรับกลุ่มเรียนนี้"]),
          true
        ),
        status: normalize(pickValue(source, ["status", "สถานะ"], "active")) || "active",
        updated_at: pickValue(source, ["updated_at", "timestamp", "วันที่อัปเดต"], ""),
      };
    })
    .filter((record) => record.term && record.course_code && record.section);
}

function loadSheetData() {
  return new Promise((resolve, reject) => {
    const callbackName = `handleSheetData_${Date.now()}`;
    const encodedSheetName = encodeURIComponent(SHEET_CONFIG.sheetName);
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.id}/gviz/tq?sheet=${encodedSheetName}&tqx=out:json;responseHandler:${callbackName}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet loading timed out"));
    }, 10000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      if (response.status !== "ok") {
        reject(new Error(response.errors?.[0]?.detailed_message || "Google Sheet returned an error"));
        return;
      }
      resolve(mapSheetTableToRecords(response.table));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Google Sheet script failed to load"));
    };

    script.src = url;
    document.head.append(script);
  });
}

function filterRecords() {
  const selectedTerm = elements.termFilter.value;
  const courseQuery = normalize(elements.courseSearch.value);
  const sectionQuery = normalize(elements.sectionSearch.value);

  return records.filter((record) => {
    const isActive = normalize(record.status) === "active" && record.confirmed;
    const matchesTerm = record.term === selectedTerm;
    const matchesCourse = normalize(record.course_code).includes(courseQuery);
    const matchesSection = normalize(record.section).includes(sectionQuery);

    return isActive && matchesTerm && matchesCourse && matchesSection;
  });
}

function renderCards() {
  const filteredRecords = filterRecords();
  elements.cardsGrid.innerHTML = "";
  elements.resultCount.textContent = `พบ ${filteredRecords.length} กลุ่มเรียน`;

  if (filteredRecords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "ไม่พบกลุ่มเรียน กรุณาตรวจสอบรหัสวิชาและกลุ่มเรียนอีกครั้ง";
    elements.cardsGrid.append(empty);
    return;
  }

  filteredRecords.forEach((record) => {
    const card = elements.cardTemplate.content.cloneNode(true);
    const qrAlt = `QR Code สำหรับ ${record.course_code} กลุ่ม ${record.section}`;

    card.querySelector(".term-pill").textContent = record.term;
    card.querySelector(".course-code").textContent = record.course_code;
    card.querySelector(".section").textContent = `Section ${record.section}`;
    card.querySelector(".teacher").textContent = record.teacher_name;

    const qrImage = card.querySelector(".qr-image");
    qrImage.src = record.qr_image_url || createQrDataUrl(`${record.course_code}-${record.section}`);
    qrImage.alt = qrAlt;

    const lineLink = card.querySelector(".line-link");
    if (record.line_group_url) {
      lineLink.href = record.line_group_url;
    } else {
      lineLink.classList.add("is-hidden");
      lineLink.removeAttribute("href");
    }

    elements.cardsGrid.append(card);
  });
}

function resetFilters() {
  elements.termFilter.value = getDefaultTerm();
  elements.courseSearch.value = "";
  elements.sectionSearch.value = "";
  renderCards();
}

async function init() {
  elements.dataStatus.textContent = "กำลังโหลดข้อมูลจาก Google Sheet...";

  try {
    const sheetRecords = await loadSheetData();
    records = sheetRecords.length > 0 ? sheetRecords : fallbackRecords;
    elements.dataStatus.textContent = sheetRecords.length > 0 ? "โหลดข้อมูลจาก Google Sheet แล้ว" : "ยังไม่พบข้อมูลใน Sheet จึงแสดงข้อมูลตัวอย่าง";
  } catch (error) {
    records = fallbackRecords;
    elements.dataStatus.textContent = "ยังโหลด Google Sheet ไม่ได้ จึงแสดงข้อมูลตัวอย่างชั่วคราว";
    console.warn(error);
  }

  setupTermFilter();
  renderCards();
}

init();

elements.termFilter.addEventListener("change", renderCards);
elements.courseSearch.addEventListener("input", renderCards);
elements.sectionSearch.addEventListener("input", renderCards);
elements.resetButton.addEventListener("click", resetFilters);
